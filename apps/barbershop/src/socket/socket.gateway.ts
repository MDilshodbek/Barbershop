import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { ApiError, Content } from '@google/genai';
import { AuthService } from '../components/auth/auth.service';
import { AiService } from '../components/ai/ai.service';
import { Member } from '../libs/dto/member/member';
import * as url from 'url';
import { randomUUID } from 'crypto';

// Minimal member shape sent to the frontend; AI_BOT uses a string _id instead of ObjectId
type ChatMember = Pick<Member, 'memberNick' | 'memberImage'> & { _id: Member['_id'] | string };

interface ClientSession {
	member: Member | null;
	history: Content[];
	isBusy: boolean;
	lastMessageAt: number;
}

interface MessagePayload {
	event: 'message';
	text: string;
	memberData: ChatMember | null;
}

interface TypingPayload {
	event: 'typing';
	isTyping: boolean;
}

interface ErrorPayload {
	event: 'error';
	text: string;
}

interface GetMessagesPayload {
	event: 'getMessages';
	list: MessagePayload[];
}

interface AiChunkPayload {
	event: 'aiChunk';
	id: string;
	text: string;
}

interface AiDonePayload {
	event: 'aiDone';
	id: string;
	text: string;
	memberData: ChatMember;
}

type OutgoingPayload =
	| MessagePayload
	| TypingPayload
	| ErrorPayload
	| GetMessagesPayload
	| AiChunkPayload
	| AiDonePayload;

const AI_BOT: ChatMember = {
	_id: 'ai-assistant',
	memberNick: 'Barber AI',
	memberImage: '/img/ai-bot.png',
};
const MAX_HISTORY = 20; // must stay even (user + model pairs)
const MAX_INPUT_LENGTH = 500;
const COOLDOWN_MS = 2000;
const AI_ERROR_REPLY = "Sorry, I'm having trouble answering right now. Please try again in a moment.";

@WebSocketGateway({ transports: ['websocket'], secure: process.env.NODE_ENV !== 'development' })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private sessions = new Map<WebSocket, ClientSession>();

	constructor(
		private authService: AuthService,
		private aiService: AiService,
	) {}

	@WebSocketServer()
	server: Server;

	public afterInit(server: Server) {
		this.logger.verbose('Websocket server Initialized');
	}

	private async retrieveAuth(req: any): Promise<Member> {
		try {
			const parseUrl = url.parse(req.url, true);
			const { token } = parseUrl.query;
			return await this.authService.verifyToken(token as string);
		} catch (error) {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: any) {
		const authMember = await this.retrieveAuth(req);
		this.sessions.set(client, { member: authMember ?? null, history: [], isBusy: false, lastMessageAt: 0 });

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}]`);

		const greeting: MessagePayload = {
			event: 'message',
			text: `Hi ${clientNick}! I'm Barber Assistant. How can I help you today?`,
			memberData: AI_BOT,
		};
		this.sendTo(client, { event: 'getMessages', list: [greeting] });
	}

	public handleDisconnect(client: WebSocket) {
		const session = this.sessions.get(client);
		this.logger.verbose(`Disconnection [${session?.member?.memberNick ?? 'Guest'}]`);
		this.sessions.delete(client);
	}

	@SubscribeMessage('message')
	public async handleMessage(client: WebSocket, payload: unknown): Promise<void> {
		const session = this.sessions.get(client);
		if (!session) return;

		// 1. Validate
		const text = typeof payload === 'string' ? payload.trim() : '';
		if (!text) return this.sendError(client, 'Message is empty');
		if (text.length > MAX_INPUT_LENGTH) {
			return this.sendError(client, `Message is too long (max ${MAX_INPUT_LENGTH} characters)`);
		}
		if (session.isBusy) return this.sendError(client, 'Please wait for the current answer');
		if (Date.now() - session.lastMessageAt < COOLDOWN_MS) {
			return this.sendError(client, 'You are sending messages too fast');
		}

		// 2. Lock session
		session.lastMessageAt = Date.now();
		session.isBusy = true;

		const clientNick: string = session.member?.memberNick ?? 'Guest';
		this.logger.verbose(`New Message [${clientNick}] (${text.length} chars)`);

		// 3. Echo + 4. typing indicator
		this.sendTo(client, { event: 'message', text, memberData: session.member });
		this.sendTo(client, { event: 'typing', isTyping: true });

		// 5. Stream AI reply
		try {
			const id = randomUUID();
			let fullReply = '';

			for await (const chunk of this.aiService.streamReply(session.history, text)) {
				// Client left mid-stream: leaving the loop also closes the Gemini stream; history is not saved
				if (!this.isConnected(client)) return;
				fullReply += chunk;
				this.sendTo(client, { event: 'aiChunk', id, text: chunk });
			}

			const reply = fullReply.trim();
			if (!reply) throw new Error('AI returned an empty reply');

			session.history.push({ role: 'user', parts: [{ text }] }, { role: 'model', parts: [{ text: reply }] });
			session.history = session.history.slice(-MAX_HISTORY);

			this.sendTo(client, { event: 'aiDone', id, text: reply, memberData: AI_BOT });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const status = err instanceof ApiError ? ` status=${err.status}` : ''; // e.g. 429 = rate limited
			this.logger.error(`AI reply failed [${clientNick}]${status}: ${message}`, err instanceof Error ? err.stack : undefined);
			this.sendTo(client, { event: 'message', text: AI_ERROR_REPLY, memberData: AI_BOT });
		} finally {
			session.isBusy = false;
			this.sendTo(client, { event: 'typing', isTyping: false });
		}
	}

	private sendTo(client: WebSocket, payload: OutgoingPayload) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(payload));
		}
	}

	private isConnected(client: WebSocket): boolean {
		return client.readyState === WebSocket.OPEN && this.sessions.has(client);
	}

	private sendError(client: WebSocket, text: string) {
		this.sendTo(client, { event: 'error', text });
	}
}
