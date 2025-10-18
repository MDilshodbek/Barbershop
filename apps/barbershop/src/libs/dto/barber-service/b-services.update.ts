import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ServiceStatus, ServiceType } from '../../enums/service.enum';

@InputType()
export class BarberServiceUpdateInput {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ServiceStatus, { nullable: true })
	barberServiceStatus?: ServiceStatus;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	barberServiceDuration?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	barberServicePrice?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	barberServiceDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	barberServiceImages?: string;

	updatedAt?: Date;
}
