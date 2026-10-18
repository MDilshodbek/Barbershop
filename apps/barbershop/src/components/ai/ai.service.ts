import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Content, GoogleGenAI } from '@google/genai';
import { KnowledgeService } from './knowledge.service';
import { buildSystemPrompt } from './ai.prompt';

const DEFAULT_MODEL = 'gemini-3.8-flash';
const FALLBACK_REPLY = "Sorry, I couldn't come up with an answer right now. Please try again in a moment.";

@Injectable()
export class AiService implements OnModuleInit {
	private readonly logger: Logger = new Logger('AiService');
	private readonly ai: GoogleGenAI;
	private readonly model: string;

	constructor(private readonly knowledgeService: KnowledgeService) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to the .env file.');

		this.ai = new GoogleGenAI({ apiKey });
		this.model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
	}

	// TEMP-SMOKE-TEST
	onModuleInit(): void {
		if (process.env.NODE_ENV !== 'production') {
			void this.runSmokeTest();
		}
	}

	// TEMP-SMOKE-TEST
	private async runSmokeTest(): Promise<void> {
		this.logger.log(`[SMOKE] AI smoke test started (model: ${this.model})`);
		try {
			const knowledge = await this.knowledgeService.getKnowledge();
			this.logger.log(`[SMOKE] Knowledge length: ${knowledge.length}`);
			this.logger.log(`[SMOKE] Knowledge preview:\n${knowledge.slice(0, 500)}`);

			const reply = await this.generateReply([], 'How much is your cheapest service?');
			this.logger.log(`[SMOKE] Gemini reply: ${reply}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error(`[SMOKE] Failed: ${message}`, err instanceof Error ? err.stack : undefined);
		}
	}

	public async generateReply(history: Content[], userText: string): Promise<string> {
		const liveData = await this.knowledgeService.getKnowledge();

		const response = await this.ai.models.generateContent({
			model: this.model,
			contents: [...history, { role: 'user', parts: [{ text: userText }] }],
			config: {
				systemInstruction: buildSystemPrompt(liveData),
				temperature: 0.5,
			},
		});

		return response.text?.trim() || FALLBACK_REPLY;
	}
}
