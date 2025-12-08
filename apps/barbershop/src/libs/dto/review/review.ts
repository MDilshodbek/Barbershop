import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { ReviewGroup, ReviewStatus } from '../../enums/review.enum';

@ObjectType()
export class Review {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ReviewStatus)
	reviewStatus: ReviewStatus;

	@Field(() => ReviewGroup)
	reviewGroup: ReviewGroup;

	@Field(() => String)
	reviewContent: string;

	@Field(() => String)
	reviewRefId: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Number)
	rating: number;

	@Field(() => [String], { nullable: true })
	reviewImages: string[];

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Reviews {
	@Field(() => [Review])
	list: Review[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
