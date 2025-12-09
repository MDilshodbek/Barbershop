import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { availableReviewSorts } from '../../config';
import { ReviewGroup, ReviewStatus } from '../../enums/review.enum';

@InputType()
export class ReviewInput {
	@IsNotEmpty()
	@Field(() => ReviewGroup)
	reviewGroup: ReviewGroup;

	@IsOptional()
	@Field(() => String, { nullable: true })
	reviewContent?: string;

	@IsNotEmpty()
	@Field(() => String)
	reviewRefId: ObjectId;

	@IsNotEmpty()
	@Field(() => Number)
	rating: number;

	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	reviewImages: string[];
}

@InputType()
class RISearch {
	@IsNotEmpty()
	@Field(() => ReviewGroup)
	reviewGroup: ReviewGroup;

	@IsNotEmpty()
	@Field(() => String)
	reviewRefId: ObjectId;
}

@InputType()
export class ReviewInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReviewSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => RISearch)
	search: RISearch;
}

@InputType()
export class AllReviewInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReviewSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ReviewStatus, { nullable: true })
	reviewStatus?: ReviewStatus;

	@IsNotEmpty()
	@Field(() => ReviewGroup)
	reviewGroup: ReviewGroup;
}
