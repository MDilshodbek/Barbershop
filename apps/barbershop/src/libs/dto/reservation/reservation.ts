import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { ReserveStatus } from '../../enums/reservation.enum';
import { Service } from '../service/service';

@ObjectType()
export class Reservation {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ReserveStatus)
	reserveStatus: ReserveStatus;

	@Field(() => String)
	barberId: ObjectId;

	@Field(() => String)
	serviceId: ObjectId;

	@Field(() => String)
	serviceTitle: string;

	@Field(() => Number)
	servicePrice: number;

	@Field(() => Int)
	serviceDurationMin: number;

	@Field(() => String)
	reserveRefId: ObjectId;

	@Field(() => Date)
	reserveTime: Date;

	@Field(() => Date)
	reserveEndTime: Date;

	@Field(() => Date)
	reserveDay: Date;

	@Field(() => String, { nullable: true })
	reserveNotes?: string;

	@Field(() => String, { nullable: true })
	cancelReason?: string;

	@Field(() => Date, { nullable: true })
	cancelledAt?: Date;

	@Field(() => String, { nullable: true })
	cancelledById?: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	// Aggregation

	@Field(() => Member, { nullable: true })
	barberData?: Member;

	@Field(() => Service, { nullable: true })
	serviceData?: Service;

	@Field(() => Member, { nullable: true })
	clientData?: Member;
}

@ObjectType()
export class Reservations {
	@Field(() => [Reservation])
	list: Reservation[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
