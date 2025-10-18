import { Field, InputType, Int } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ServiceStatus } from '../../enums/service.enum';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class BarberServiceInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	barberId?: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	serviceId: ObjectId;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	barberServicePrice?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	barberServiceDuration?: number;

	@IsOptional()
	@Field(() => ServiceStatus, { nullable: true })
	barberServiceStatus?: ServiceStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	barberServiceDesc?: String;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	barberServiceImages?: String[];
}

@InputType()
export class BarberServiceInquiry {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => ServiceStatus, { nullable: true })
	serviceStatus?: ServiceStatus;
}
