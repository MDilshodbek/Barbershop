import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ServiceType } from '../../enums/service.enum';

@InputType()
export class ServiceInput {
	@IsNotEmpty()
	@Field(() => ServiceType)
	serviceType: ServiceType;

	@IsNotEmpty()
	@Field(() => String)
	serviceTitle: string;

	@IsNotEmpty()
	@Field(() => Number)
	serviceDuration: Number;

	@IsNotEmpty()
	@Field(() => Number)
	servicePrice: Number;

	@IsOptional()
	@Field(() => String)
	serviceDesc?: String;

	@IsNotEmpty()
	@Field(() => [String])
	serviceImages?: String[];
}
