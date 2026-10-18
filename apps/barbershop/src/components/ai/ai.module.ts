import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../schemas/Service.model';
import MemberSchema from '../../schemas/Member.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { AiService } from './ai.service';
import { KnowledgeService } from './knowledge.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Services', schema: ServiceSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'BoardArticle', schema: BoardArticleSchema },
		]),
	],
	providers: [AiService, KnowledgeService],
	exports: [AiService],
})
export class AiModule {}
