// Dev-only Gemini latency diagnostic. Not part of the app build.
// Run: npx ts-node --transpile-only scripts/ai-latency.ts
// Compare models: npx ts-node --transpile-only scripts/ai-latency.ts <model> [<model> ...]
import 'dotenv/config';
import { GenerateContentConfig, GoogleGenAI, ThinkingLevel } from '@google/genai';
import { buildSystemPrompt } from '../apps/barbershop/src/components/ai/ai.prompt';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 150_000 } });

// Synthetic shop data roughly the size of the real knowledge (no MongoDB needed)
const fakeLiveData = Array.from(
	{ length: 25 },
	(_, i) => `- Service ${i + 1}: Haircut variant ${i + 1}, price $${20 + i}, duration ${30 + i} min`,
).join('\n');
const systemPrompt = buildSystemPrompt(fakeLiveData);
const question = 'How much is a haircut?';

async function timeHttps(): Promise<void> {
	const t0 = Date.now();
	try {
		const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
			headers: { 'x-goog-api-key': apiKey as string },
		});
		await res.text();
		console.log(`[HTTPS] models.list status=${res.status} ms=${Date.now() - t0}`);
	} catch (err) {
		console.log(`[HTTPS] failed ms=${Date.now() - t0}: ${err instanceof Error ? err.message : String(err)}`);
	}
}

async function pickLiteModel(): Promise<string | null> {
	const names: string[] = [];
	const pager = await ai.models.list({ config: { pageSize: 100 } });
	for await (const m of pager) {
		if (m.name && m.supportedActions?.includes('generateContent')) names.push(m.name.replace('models/', ''));
	}
	console.log(`[MODELS] flash models: ${names.filter((n) => n.includes('flash')).join(', ')}`);
	const lite = names.filter((n) => n.includes('flash-lite') && !n.includes('preview') && !n.includes('tts'));
	return lite.sort().reverse()[0] ?? null;
}

async function timeStream(
	label: string,
	useModel: string,
	text: string,
	config: GenerateContentConfig,
	printReply = false,
): Promise<void> {
	const t0 = Date.now();
	let firstChunkMs: number | null = null;
	let chunks = 0;
	let reply = '';
	let usage: { promptTokenCount?: number; thoughtsTokenCount?: number; candidatesTokenCount?: number } | undefined;
	try {
		const stream = await ai.models.generateContentStream({
			model: useModel,
			contents: [{ role: 'user', parts: [{ text }] }],
			config,
		});
		const headersMs = Date.now() - t0;
		for await (const chunk of stream) {
			if (firstChunkMs === null) firstChunkMs = Date.now() - t0;
			chunks++;
			if (chunk.usageMetadata) usage = chunk.usageMetadata;
			if (chunk.text) reply += chunk.text;
		}
		console.log(
			`[${label}] model=${useModel} headersMs=${headersMs} firstChunkMs=${firstChunkMs} totalMs=${Date.now() - t0} ` +
				`chunks=${chunks} prompt=${usage?.promptTokenCount ?? '-'} thoughts=${usage?.thoughtsTokenCount ?? '-'} ` +
				`output=${usage?.candidatesTokenCount ?? '-'}`,
		);
		if (printReply) console.log(`[${label}] reply:\n${reply.trim()}\n`);
	} catch (err) {
		const status = err && typeof err === 'object' && 'status' in err ? ` status=${(err as { status: unknown }).status}` : '';
		console.log(`[${label}] model=${useModel} FAILED ms=${Date.now() - t0}${status}: ${err instanceof Error ? err.message : String(err)}`);
	}
}

async function compareModels(models: string[]): Promise<void> {
	const config: GenerateContentConfig = { systemInstruction: systemPrompt, temperature: 0.5 };
	const questions = [question, 'Which hairstyle suits a round face?', '커트 가격이 얼마예요?'];
	for (const m of models) {
		for (const [i, q] of questions.entries()) {
			await timeStream(`${m} q${i + 1}`, m, q, config, true);
		}
	}
}

async function main(): Promise<void> {
	const models = process.argv.slice(2);
	if (models.length) return compareModels(models);

	console.log(`[INFO] model=${model} systemPromptChars=${systemPrompt.length}`);
	await timeHttps();
	await timeHttps();

	const liteModel = await pickLiteModel();

	await timeStream('1 tiny', model, 'Say hi in one word.', {});
	await timeStream('2 real', model, question, { systemInstruction: systemPrompt, temperature: 0.5 });
	await timeStream('3 real+minimal', model, question, {
		systemInstruction: systemPrompt,
		temperature: 0.5,
		thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
	});
	if (liteModel) {
		await timeStream('4 lite', liteModel, question, { systemInstruction: systemPrompt, temperature: 0.5 });
	} else {
		console.log('[4 lite] no flash-lite model available for this key');
	}
}

void main();
