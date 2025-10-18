import { Module } from '@nestjs/common';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'BoardArticle', schema: BoardArticleSchema }])],
	providers: [],
})
export class BoardArticleModule {}
