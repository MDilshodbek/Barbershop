import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';

@ObjectType()
export class Service {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ServiceType)
	serviceType: ServiceType;

	@Field(() => ServiceStatus)
	serviceStatus: ServiceStatus;

	@Field(() => String)
	serviceTitle: string;

	@Field(() => Int)
	serviceDuration: number;

	@Field(() => Int)
	servicePrice: number;

	@Field(() => Int)
	serviceLikes: number;

	@Field(() => Int)
	serviceRank: number;

	@Field(() => [String])
	serviceImages: string[];

	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Services {
	@Field(() => [Service])
	list: Service[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
