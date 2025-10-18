import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';
import { Member, TotalCounter } from '../member/member';
import { MemberLevel, MemberStatus, MemberType } from '../../enums/member.enum';

@ObjectType()
export class BCutService {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	barberId: ObjectId;

	@Field(() => String)
	serviceId: ObjectId;

	@Field(() => ServiceType, { nullable: true })
	serviceType?: ServiceType;

	@Field(() => ServiceStatus, { nullable: true })
	barberServiceStatus?: ServiceStatus;

	@Field(() => Int, { nullable: true })
	barberServicePrice?: number;

	@Field(() => Int, { nullable: true })
	barberServiceDuration?: number;

	@Field(() => Int, { nullable: true })
	serviceLikes?: number;

	@Field(() => Int, { nullable: true })
	serviceRank?: number;

	@Field(() => [String], { nullable: true })
	barberServiceImages?: string[];

	@Field(() => String, { nullable: true })
	barberServiceDesc?: string;

	@Field(() => Member, { nullable: true })
	barberData?: Member;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class BCutServices {
	@Field(() => [BCutService])
	list: BCutService[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
