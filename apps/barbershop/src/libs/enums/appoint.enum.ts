import { registerEnumType } from '@nestjs/graphql';

export enum AppointStatus {
	BOOKED = 'BOOKED',
	CANCELLED = 'CANCELLED',
}

registerEnumType(AppointStatus, {
	name: 'AppointStatus',
});
