import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReservationService } from './reservation.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reservation, Reservations } from '../../libs/dto/reservation/reservation';
import {
	BarberScheduleInquiry,
	CancelReservationInput,
	ReserveInput,
	ReserveInquiry,
} from '../../libs/dto/reservation/reservation.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';

@Resolver()
export class ReservationResolver {
	constructor(private readonly reserveService: ReservationService) {}

	@Roles(MemberType.BARBER, MemberType.USER)
	@UseGuards(RolesGuard)
	@Mutation(() => Reservation)
	public async createReservation(
		@Args('input') input: ReserveInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reservation> {
		console.log('Mutation: createReservation');

		input.reserveRefId = memberId;
		return await this.reserveService.createReservation(input);
	}

	@Roles(MemberType.USER, MemberType.BARBER, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Reservation)
	public async cancelReservation(
		@Args('input') input: CancelReservationInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reservation> {
		console.log('Mutation: cancelReservation');
		return await this.reserveService.cancelReservation(input, memberId);
	}

	@Roles(MemberType.USER)
	@UseGuards(RolesGuard)
	@Query(() => Reservations)
	public async getMyReservations(
		@Args('input', { nullable: true }) input: ReserveInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reservations> {
		console.log('Query: getMyReservations');
		return await this.reserveService.getMyReservations(memberId, input);
	}

	@Roles(MemberType.BARBER)
	@UseGuards(RolesGuard)
	@Query(() => Reservations)
	public async getBarberSchedules(
		@Args('input', { nullable: true }) input: BarberScheduleInquiry,
		@AuthMember('_id') barberId: ObjectId,
	): Promise<Reservations> {
		console.log('Query: getMyReservations');
		return await this.reserveService.getBarberSchedules(barberId, input);
	}
}
