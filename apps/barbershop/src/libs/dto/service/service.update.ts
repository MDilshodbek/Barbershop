import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';

@InputType()
export class ServiceUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ServiceType, { nullable: true })
	serviceType?: ServiceType;

	@IsOptional()
	@Field(() => ServiceStatus, { nullable: true })
	serviceStatus?: ServiceStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	serviceDuration?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	servicePrice?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceImages?: string;

	updatedAt?: Date;
}
