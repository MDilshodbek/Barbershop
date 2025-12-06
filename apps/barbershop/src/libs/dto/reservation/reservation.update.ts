import { Field, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ReserveStatus } from '../../enums/reservation.enum';

@InputType()
export class ReserveUpdate {
	@Field(() => String)
	reservationId: ObjectId;

	@Field(() => ReserveStatus)
	reserveStatus: ReserveStatus;
}
