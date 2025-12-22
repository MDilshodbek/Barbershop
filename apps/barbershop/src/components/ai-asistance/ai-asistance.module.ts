import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import ServiceSchema from '../../schemas/Service.model';
import MemberSchema from '../../schemas/Member.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model'; // ✅ Comment: adjust to your real file name/path
import { AiAssistantResolver } from './ai-asistance.resolver';
import { AiAssistantService } from './ai-asistance.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Services', schema: ServiceSchema },
			{ name: 'Members', schema: MemberSchema },
			{ name: 'BoardArticles', schema: BoardArticleSchema }, // ✅ Comment: new model registration
		]),
		AuthModule,
	],
	providers: [AiAssistantResolver, AiAssistantService],
	exports: [AiAssistantService],
})
export class AiAssistantModule {}
