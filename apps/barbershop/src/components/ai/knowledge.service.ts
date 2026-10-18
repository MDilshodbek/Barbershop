import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from '../../libs/dto/service/service';
import { Member } from '../../libs/dto/member/member';
import { BoardArticle } from '../../libs/dto/borad-article/board-article';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';

const CACHE_TTL_MS = 5 * 60 * 1000;
const LIST_LIMIT = 50;
const ARTICLE_LIMIT = 10;
const DESC_MAX_LENGTH = 150;
const UNAVAILABLE_TEXT = 'Shop data is temporarily unavailable.';

@Injectable()
export class KnowledgeService {
	private readonly logger: Logger = new Logger('KnowledgeService');
	private cacheText: string | null = null;
	private cacheExpiresAt: number = 0;
	private inFlight: Promise<string> | null = null;

	constructor(
		@InjectModel('Services') private readonly servicesModel: Model<Service>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
	) {}

	public async getKnowledge(): Promise<string> {
		if (this.cacheText && Date.now() < this.cacheExpiresAt) return this.cacheText;
		if (!this.inFlight) {
			this.inFlight = this.loadKnowledge().finally(() => {
				this.inFlight = null;
			});
		}
		return this.inFlight;
	}

	private async loadKnowledge(): Promise<string> {
		try {
			const [services, barbers, articles] = await Promise.all([
				this.servicesModel
					.find({ serviceStatus: ServiceStatus.ACTIVE })
					.select('serviceTitle serviceType servicePrice serviceDuration serviceDesc')
					.sort({ serviceType: 1, servicePrice: 1 })
					.limit(LIST_LIMIT)
					.lean()
					.exec(),
				this.memberModel
					.find({ memberType: MemberType.BARBER, memberStatus: MemberStatus.ACTIVE })
					.select('memberNick memberFullName memberLevel memberDesc memberRank memberLikes memberReviews')
					.sort({ memberRank: -1 })
					.limit(LIST_LIMIT)
					.lean()
					.exec(),
				this.boardArticleModel
					.find({ articleStatus: BoardArticleStatus.ACTIVE })
					.select('articleTitle articleCategory articleLikes')
					.sort({ createdAt: -1 })
					.limit(ARTICLE_LIMIT)
					.lean()
					.exec(),
			]);

			const text = [
				'### Services and prices (USD)',
				...(services.length
					? services.map(
							(s) =>
								`- ${s.serviceTitle} [${s.serviceType}]: $${s.servicePrice} (${s.serviceDuration} min)` +
								this.formatDesc(s.serviceDesc),
						)
					: ['- No active services.']),
				'',
				'### Barbers',
				...(barbers.length
					? barbers.map(
							(b) =>
								`- ${b.memberNick}${b.memberFullName ? ` (${b.memberFullName})` : ''}, level ${b.memberLevel}, ` +
								`${b.memberLikes} likes, ${b.memberReviews} reviews` +
								this.formatDesc(b.memberDesc),
						)
					: ['- No active barbers.']),
				'',
				'### Latest community posts',
				...(articles.length
					? articles.map((a) => `- "${a.articleTitle}" [${a.articleCategory}], ${a.articleLikes} likes`)
					: ['- No posts yet.']),
			].join('\n');

			this.cacheText = text;
			this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
			return text;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error(`Failed to load shop data: ${message}`, err instanceof Error ? err.stack : undefined);
			return this.cacheText ?? UNAVAILABLE_TEXT;
		}
	}

	private formatDesc(desc?: string): string {
		if (!desc) return '';
		const clean = desc.replace(/\s+/g, ' ').trim();
		const short = clean.length > DESC_MAX_LENGTH ? `${clean.slice(0, DESC_MAX_LENGTH)}...` : clean;
		return ` - ${short}`;
	}
}
