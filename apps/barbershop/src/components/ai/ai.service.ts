import { Injectable, Logger } from '@nestjs/common';
import { Content, GenerateContentResponseUsageMetadata, GoogleGenAI } from '@google/genai';
import { KnowledgeService } from './knowledge.service';
import { buildSystemPrompt } from './ai.prompt';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
// Per attempt, including reading the stream; a stuck request falls into the gateway's sorry message
const REQUEST_TIMEOUT_MS = 20_000;
const LOG_TIMING = process.env.NODE_ENV !== 'production';

interface AiTiming {
	outcome: 'complete' | 'aborted' | 'error';
	knowledgeMs: number;
	firstChunkMs: number | null;
	totalMs: number;
	chunks: number;
	usage?: GenerateContentResponseUsageMetadata;
}

@Injectable()
export class AiService {
	private readonly logger: Logger = new Logger('AiService');
	private readonly ai: GoogleGenAI;
	private readonly model: string;

	constructor(private readonly knowledgeService: KnowledgeService) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to the .env file.');

		this.ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: REQUEST_TIMEOUT_MS } });
		this.model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
	}

	public async *streamReply(history: Content[], userText: string): AsyncGenerator<string> {
		const startedAt = Date.now();
		const liveData = await this.knowledgeService.getKnowledge();
		const knowledgeMs = Date.now() - startedAt;

		const requestAt = Date.now();
		let firstChunkMs: number | null = null;
		let chunks = 0;
		let usage: GenerateContentResponseUsageMetadata | undefined;
		// Stays 'aborted' if the consumer stops early (client disconnected)
		let outcome: AiTiming['outcome'] = 'aborted';
		try {
			const stream = await this.ai.models.generateContentStream({
				model: this.model,
				contents: [...history, { role: 'user', parts: [{ text: userText }] }],
				config: {
					systemInstruction: buildSystemPrompt(liveData),
					temperature: 0.5,
				},
			});

			for await (const chunk of stream) {
				if (firstChunkMs === null) firstChunkMs = Date.now() - requestAt;
				chunks++;
				if (chunk.usageMetadata) usage = chunk.usageMetadata;
				if (chunk.text) yield chunk.text;
			}
			outcome = 'complete';
		} catch (err) {
			outcome = 'error';
			throw err;
		} finally {
			const totalMs = Date.now() - requestAt;
			this.logTiming({ outcome, knowledgeMs, firstChunkMs, totalMs, chunks, usage });
		}
	}

	private logTiming(t: AiTiming): void {
		if (!LOG_TIMING) return;
		this.logger.log(
			`[AI-TIMING] model=${this.model} outcome=${t.outcome} ` +
				`knowledgeMs=${t.knowledgeMs} firstChunkMs=${t.firstChunkMs ?? '-'} totalMs=${t.totalMs} chunks=${t.chunks} ` +
				`promptTokens=${t.usage?.promptTokenCount ?? '-'} thoughtsTokens=${t.usage?.thoughtsTokenCount ?? '-'} ` +
				`candidatesTokens=${t.usage?.candidatesTokenCount ?? '-'}`,
		);
	}
}
