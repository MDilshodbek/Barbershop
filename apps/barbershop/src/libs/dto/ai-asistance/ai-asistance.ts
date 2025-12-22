import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class AskShopAssistantInput {
	@IsNotEmpty()
	@Field(() => String)
	message: string;
}

// ✅ Comment: this matches the object you return in service
@ObjectType()
export class SuggestedArticleOutput {
	@Field(() => String)
	_id: string;

	@Field(() => String)
	articleTitle: string;

	@Field(() => String, { nullable: true })
	articlePreview?: string;

	@Field(() => [String], { nullable: true })
	articleImage?: string[];
}

@ObjectType()
export class AskShopAssistantOutput {
	@Field(() => String)
	answer: string;

	@Field(() => Boolean)
	usedWebsiteData: boolean;

	@Field(() => Boolean)
	hasMatchingArticle: boolean;

	// ✅ Comment: changed from string[] to SuggestedArticleOutput[]
	@Field(() => [SuggestedArticleOutput], { nullable: true })
	suggestedArticles?: SuggestedArticleOutput[];
}
