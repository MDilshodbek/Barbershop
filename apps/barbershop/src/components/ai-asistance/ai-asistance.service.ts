import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { AskShopAssistantOutput } from '../../libs/dto/ai-asistance/ai-asistance';

type ServiceDoc = {
	serviceStatus: ServiceStatus;
	serviceTitle: string;
	serviceDesc?: string;
	servicePrice: number;
	serviceDuration: number;
};

type MemberDoc = {
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberNick: string;
	memberFullName?: string;
	memberDesc?: string;
};

// ✅ New: BoardArticle doc type based on your schema
type BoardArticleDoc = {
	_id: any;
	articleStatus?: BoardArticleStatus;
	articleTitle: string;
	articleContent: string;
	articleImage?: string[];
};

@Injectable()
export class AiAssistantService {
	private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

	constructor(
		@InjectModel('Services') private readonly serviceModel: Model<ServiceDoc>,
		@InjectModel('Members') private readonly memberModel: Model<MemberDoc>,
		@InjectModel('BoardArticles') private readonly articleModel: Model<BoardArticleDoc>, // ✅ Comment: new injected model
	) {}

	async answer(message: string): Promise<AskShopAssistantOutput> {
		// ✅ Comment: always try website data first (services + barbers + articles)
		const websiteData = await this.searchWebsiteData(message);

		const hasWebsiteMatch =
			websiteData.services.length > 0 || websiteData.barbers.length > 0 || websiteData.articles.length > 0;

		if (hasWebsiteMatch) {
			// ✅ Comment: build answer strictly from Mongo fields (no outside info)
			const answer = await this.buildWebsiteOnlyAnswer(message, websiteData);

			return {
				answer,
				usedWebsiteData: true,
				hasMatchingArticle: websiteData.articles.length > 0,
				suggestedArticles: websiteData.articles.map((a) => ({
					_id: String(a._id),
					articleTitle: a.articleTitle,
					articlePreview: this.makePreview(a.articleContent),
					articleImage: a.articleImage ?? [],
				})),
			};
		}

		// ✅ Comment: no Mongo match => general question => outside
		const answer = await this.buildOutsideAnswer(message);

		return {
			answer,
			usedWebsiteData: false,
			hasMatchingArticle: false,
			suggestedArticles: [],
		};
	}

	private async searchWebsiteData(message: string): Promise<{
		services: Array<Pick<ServiceDoc, 'serviceTitle' | 'serviceDesc' | 'servicePrice' | 'serviceDuration'>>;
		barbers: Array<Pick<MemberDoc, 'memberNick' | 'memberFullName' | 'memberDesc'>>;
		articles: Array<Pick<BoardArticleDoc, '_id' | 'articleTitle' | 'articleContent' | 'articleImage'>>;
	}> {
		const safe = this.escapeRegex(message);
		const rx = new RegExp(safe, 'i');

		// ✅ Comment: services (ACTIVE only)
		const services = await this.serviceModel
			.find(
				{
					serviceStatus: ServiceStatus.ACTIVE,
					$or: [{ serviceTitle: rx }, { serviceDesc: rx }],
				},
				{ serviceTitle: 1, serviceDesc: 1, servicePrice: 1, serviceDuration: 1 },
			)
			.limit(5)
			.lean();

		// ✅ Comment: barbers are Members with type BARBER (ACTIVE only)
		const barbers = await this.memberModel
			.find(
				{
					memberType: MemberType.BARBER,
					memberStatus: MemberStatus.ACTIVE,
					$or: [{ memberNick: rx }, { memberFullName: rx }, { memberDesc: rx }],
				},
				{ memberNick: 1, memberFullName: 1, memberDesc: 1 },
			)
			.limit(5)
			.lean();

		// ✅ Comment: articles (if you have articleStatus, filter ACTIVE; otherwise omit)
		const articleMatchQuery: any = {
			$or: [{ articleTitle: rx }, { articleContent: rx }],
		};

		// ✅ Comment: only apply status filter if your schema uses it consistently
		// if (BoardArticleStatus?.ACTIVE) articleMatchQuery.articleStatus = BoardArticleStatus.ACTIVE;

		const articles = await this.articleModel
			.find(articleMatchQuery, { articleTitle: 1, articleContent: 1, articleImage: 1 })
			.limit(3)
			.lean();

		return { services, barbers, articles };
	}

	private async buildWebsiteOnlyAnswer(
		message: string,
		data: {
			services: Array<Pick<ServiceDoc, 'serviceTitle' | 'serviceDesc' | 'servicePrice' | 'serviceDuration'>>;
			barbers: Array<Pick<MemberDoc, 'memberNick' | 'memberFullName' | 'memberDesc'>>;
			articles: Array<Pick<BoardArticleDoc, '_id' | 'articleTitle' | 'articleContent' | 'articleImage'>>;
		},
	): Promise<string> {
		// ✅ Comment: assistant must mention community articles if relevant
		const response = await this.openai.responses.create({
			model: 'gpt-4.1-mini',
			input: [
				{
					role: 'system',
					content:
						'You are a barbershop assistant. Answer ONLY using the provided website data JSON. ' +
						'Do not add outside information. Do not guess prices. ' +
						'If any matching community article exists, you MUST mention it and suggest visiting the Community page. ' +
						'If there are multiple matches, list short options and ask which one the user means.',
				},
				{
					role: 'user',
					content: JSON.stringify({
						userMessage: message,
						services: data.services,
						barbers: data.barbers,
						articles: data.articles.map((a) => ({
							_id: String(a._id),
							articleTitle: a.articleTitle,
							articlePreview: this.makePreview(a.articleContent),
						})),
					}),
				},
			],
		});

		return response.output_text;
	}

	private async buildOutsideAnswer(message: string): Promise<string> {
		const response = await this.openai.responses.create({
			model: 'gpt-4.1-mini',
			input: [
				{
					role: 'system',
					content:
						'Answer general haircut and grooming questions. You may use web search. ' +
						"Do not claim you know this shop's prices or services.",
				},
				{ role: 'user', content: message },
			],
			tools: [{ type: 'web_search' }],
		});

		return response.output_text;
	}

	private makePreview(text: string): string {
		// ✅ Comment: keep preview short for chat UI
		const clean = (text ?? '').replace(/\s+/g, ' ').trim();
		return clean.length > 160 ? `${clean.slice(0, 160)}...` : clean;
	}

	private escapeRegex(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
