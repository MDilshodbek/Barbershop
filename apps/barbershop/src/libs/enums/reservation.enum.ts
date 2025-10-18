import { registerEnumType } from '@nestjs/graphql';

export enum ReserveStatus {
	BOOKED = 'BOOKED',
	CANCELLED = 'CANCELLED',
	FINISH = 'FINISH',
	NOSHOW = 'NOSHOW',
	CONFIRMED = 'CONFIRMED',
}

registerEnumType(ReserveStatus, {
	name: 'AppointStatus',
});
