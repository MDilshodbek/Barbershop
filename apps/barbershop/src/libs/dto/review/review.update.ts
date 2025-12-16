import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ReviewGroup, ReviewStatus } from '../../enums/review.enum';

@InputType()
export class ReviewUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ReviewStatus, { nullable: true })
	reviewStatus?: ReviewStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	reviewContent?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	reviewImages?: string[];

	@IsOptional()
	@Field(() => Number, { nullable: true })
	rating?: number;

	@IsNotEmpty()
	@Field(() => String)
	reviewRefId: ObjectId;
}
