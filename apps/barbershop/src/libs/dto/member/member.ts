import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MemberAuthType, MemberLevel, MemberStatus, MemberType } from '../../enums/member.enum';

@ObjectType()
export class Member {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => MemberType)
	memberType: MemberType;

	@Field(() => MemberStatus)
	memberStatus: MemberStatus;

	@Field(() => MemberAuthType)
	memberAuthType: MemberAuthType;

	@Field(() => MemberLevel)
	memberLevel: MemberLevel;

	@Field(() => [BarberServiceType])
	memberService: BarberServiceType[];

	@Field(() => String)
	memberPhone: string;

	@Field(() => String)
	memberNick: string;

	memberPassword?: string;

	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@Field(() => String)
	memberImage: string;

	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@Field(() => Int)
	memberArticles: number;

	@Field(() => Int)
	memberFollowers: number;

	@Field(() => Int)
	memberFollowings?: number;

	@Field(() => Int)
	memberPoints: number;

	@Field(() => Int)
	memberLikes: number;

	@Field(() => Int)
	memberViews: number;

	@Field(() => Int)
	memberReviews: number;

	@Field(() => Int)
	memberComments: number;

	@Field(() => Int)
	memberRank: number;

	@Field(() => Int)
	memberWarnings: number;

	@Field(() => Int)
	memberBlocks: number;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => String, { nullable: true })
	accessToken?: string;
}

@ObjectType('BarberService')
export class BarberServiceType {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	name: string;

	@Field(() => Int)
	price: number;

	@Field(() => Int)
	durationMinutes: number;

	@Field(() => String, { nullable: true })
	description?: string;
}
