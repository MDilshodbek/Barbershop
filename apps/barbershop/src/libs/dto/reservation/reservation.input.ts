import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsIn, IsNotEmpty, IsOptional, Matches, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { availableReserveSorts, availableScheduleSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ReserveInput {
	@IsNotEmpty()
	@Field(() => String)
	barberId?: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	serviceId: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	reserveRefId?: ObjectId;

	@IsNotEmpty()
	@IsDate()
	@Field(() => Date)
	reserveTime: Date;

	@IsNotEmpty()
	@IsDate()
	@Field(() => Date)
	reserveDay: Date;

	@IsOptional()
	@Field(() => String, { nullable: true })
	reserveNotes?: string;
}

@InputType()
export class ReserveInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableReserveSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}

@InputType()
export class BarberScheduleInquiry {
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'ymd must be YYYY-MM-DD' })
	@Field(() => String, { nullable: true })
	ymd?: string;

	@Field(() => Date, { nullable: true }) reserveDay?: Date;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableScheduleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}

@InputType()
export class CancelReservationInput {
	@Field(() => String)
	reservationId: ObjectId;

	@Field(() => String, { nullable: true })
	reason?: string;
}
