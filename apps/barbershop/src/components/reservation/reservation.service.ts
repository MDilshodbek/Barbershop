import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { Reservation, Reservations } from '../../libs/dto/reservation/reservation';
import {
	BarberScheduleInquiry,
	AllBarberScheduleInquiry,
	CancelReservationInput,
	ReserveInput,
	ReserveInquiry,
	SelectedBarberScheduleInquiry,
} from '../../libs/dto/reservation/reservation.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ReserveStatus } from '../../libs/enums/reservation.enum';
import { Member } from '../../libs/dto/member/member';
import { MemberService } from '../member/member.service';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Service } from '../../libs/dto/service/service';
import { T } from '../../libs/types/common';
import { lookupBarber, lookupService, lookupUser } from '../../libs/pipelines/barber-service.pipes';
import {
	kstDayWindow,
	seoulDayWindowUTC,
	seoulHourMinute,
	shapeIntoMongoObjectId,
	ymdInSeoul,
} from '../../libs/config';
import { NotificationService } from '../notification/notification.service';
import { ReserveUpdate } from '../../libs/dto/reservation/reservation.update';

@Injectable()
export class ReservationService {
	constructor(
		@InjectModel('Reservation') private readonly reserveModel: Model<Reservation>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly servicesModel: Model<Service>,
		private memberService: MemberService,
		private notificationService: NotificationService,
	) {}

	public async createReservation(input: ReserveInput): Promise<Reservation> {
		const { barberId, serviceId, reserveRefId, reserveTime } = input;

		// upfront guard
		if (!barberId || !serviceId || !reserveTime || !reserveRefId) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		// parse client time
		const start = new Date(reserveTime);
		if (isNaN(start.getTime())) {
			throw new BadRequestException('Invalid reserveTime');
		}

		const now = new Date();
		if (start.getTime() <= now.getTime()) {
			throw new BadRequestException('Reservation must be in the future');
		}

		// day / window calculation
		const ymd = ymdInSeoul(start);
		const { startUtc: dayStartUtc, endUtc: dayEndUtc } = seoulDayWindowUTC(ymd, 9, 20);

		// start in 09:00–20:00
		const { h: startH, m: startM } = seoulHourMinute(start);
		if (startH < 9 || startH >= 20) {
			throw new BadRequestException('Reservation must start between 09:00 and 20:00 (Seoul time)');
		}

		// load base Service info for denormalized snapshot
		const service = await this.servicesModel
			.findById(serviceId)
			.select('_id serviceTitle serviceDuration servicePrice')
			.lean()
			.exec();

		if (!service) {
			throw new BadRequestException('Service not found');
		}

		// compute duration from Service
		let durationMin = service.serviceDuration;
		if (typeof durationMin !== 'number' || durationMin <= 0) {
			throw new BadRequestException('Service duration not defined');
		}
		durationMin = Math.trunc(durationMin); // COMMENT: force integer minutes

		// compute end time using denormalized duration
		const end = new Date(start.getTime() + durationMin * 60000);

		// ensure END does not go past 20:00
		const { h: endH, m: endM } = seoulHourMinute(end);
		if (endH > 20 || (endH === 20 && endM > 0)) {
			throw new BadRequestException('Reservation must end by 20:00 (Seoul time)');
		}

		// keep full interval within window
		if (start < dayStartUtc || end > dayEndUtc) {
			throw new BadRequestException('Reservation must be within 09:00 to 20:00 for the selected day (Seoul time)');
		}

		// reserveDay
		const reserveDayKst = new Date(`${ymd}T00:00:00+09:00`);
		const reserveDayUtc = new Date(reserveDayKst.toISOString());

		// check barber availability
		const conflict = await this.reserveModel
			.findOne({
				barberId,
				reserveStatus: ReserveStatus.BOOKED,
				reserveTime: { $lt: end },
				reserveEndTime: { $gt: start },
			})
			.select('_id reserveTime reserveEndTime')
			.lean()
			.exec();

		if (conflict) {
			throw new BadRequestException('Selected time is not available');
		}

		try {
			// persist denormalized service fields
			const doc = await this.reserveModel.create({
				...input,
				reserveTime: start,
				reserveEndTime: end,
				reserveDay: reserveDayUtc,

				// denormalized snapshot from Service at booking time
				serviceId: service._id,
				serviceTitle: service.serviceTitle,
				servicePrice: service.servicePrice,
				serviceDurationMin: durationMin,
			});

			await this.notificationService.createAppointmentNotification({
				barberId: doc.barberId,
				memberId: reserveRefId,
				appointmentId: doc._id,
			});

			return doc;
		} catch (error) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async cancelReservation(input: CancelReservationInput, memberId: ObjectId): Promise<Reservation> {
		const { reservationId, cancelReason } = input;

		// fetch reservation
		const reservation = await this.reserveModel
			.findById(reservationId)
			.select('_id reserveStatus reserveRefId barberId reserveTime reserveDay')
			.lean()
			.exec();
		if (!reservation) throw new BadRequestException('Reservation not found');

		// only cancellable state
		if (reservation.reserveStatus !== ReserveStatus.BOOKED) {
			throw new BadRequestException('Reservation cannot be cancelled');
		}

		// set CANCELLED
		const updated = await this.reserveModel
			.findOneAndUpdate(
				{ _id: reservationId, reserveStatus: ReserveStatus.BOOKED },
				{
					$set: {
						reserveStatus: ReserveStatus.CANCELLED,
						cancelReason: cancelReason ?? null,
						cancelledAt: new Date(),
						cancelledById: memberId,
					},
				},
				{ new: true, runValidators: true },
			)
			.exec();
		if (!updated) throw new BadRequestException('Cancel failed');

		// increment memberWarnings ONLY when the USER cancels (not barber/admin)
		const isOwner = String(reservation.reserveRefId) === String(memberId);
		if (isOwner) {
			//  add +1 to memberWarnings
			const user = await this.memberService.memberStatsEditor({
				_id: reservation.reserveRefId,
				targetKey: 'memberWarnings',
				modifier: 1,
			});

			// block at 3+
			if ((user?.memberWarnings ?? 0) >= 3 && user.memberStatus !== MemberStatus.BLOCK) {
				await this.memberModel.updateOne({ _id: user._id }, { $set: { memberStatus: MemberStatus.BLOCK } }).exec();
			}
		}

		if (updated) {
			await this.notificationService.createCancelledReservationNotification({
				barberId: updated.barberId,
				memberId: updated.reserveRefId,
				appointmentId: updated._id,
			});

			return updated;
		}
	}

	public async getMyReservations(memberId: ObjectId, input: ReserveInquiry): Promise<Reservations> {
		const match: T = { reserveRefId: memberId };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.reserveModel
			.aggregate([
				{ $match: match } as PipelineStage,
				{ $sort: sort } as PipelineStage,
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },

							lookupBarber as PipelineStage,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } } as PipelineStage,
							{ $set: { barberData: '$memberData' } } as PipelineStage,

							lookupService as PipelineStage,
							{ $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } } as PipelineStage,
							{ $set: { serviceData: '$serviceData' } } as PipelineStage,
						] as PipelineStage[],

						metaCounter: [{ $count: 'total' }] as unknown as PipelineStage[],
					},
				} as PipelineStage,
			])
			.exec();

		if (!result?.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getBarberSchedules(barberId: ObjectId, input: BarberScheduleInquiry): Promise<Reservations> {
		// 1) BASE MATCH
		const match: any = { barberId };

		const ymd: string | undefined =
			input?.ymd?.trim?.() ?? (input?.reserveDay ? ymdInSeoul(new Date(input.reserveDay)) : undefined);

		if (ymd) {
			const { start, end } = kstDayWindow(ymd, 9, 20); // 09:00–20:00 KST → UTC Date
			match.reserveTime = { $gte: start, $lt: end };
		}

		// 3) SORT
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		// 5) PIPELINE
		const pipeline: PipelineStage[] = [
			{ $match: match } as PipelineStage,
			{ $sort: sort } as PipelineStage,
			{
				$facet: {
					list: [
						lookupUser as PipelineStage,
						{ $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } } as PipelineStage,
					] as unknown as PipelineStage[],

					metaCounter: [{ $count: 'total' }] as unknown as PipelineStage[],
				},
			} as PipelineStage,
		];

		const res = await this.reserveModel.aggregate(pipeline).exec();
		if (!res?.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return res[0];
	}

	public async getSelectedBarberSchedules(input: SelectedBarberScheduleInquiry): Promise<Reservations> {
		// 1) BASE MATCH
		let { barberId } = input;

		barberId = shapeIntoMongoObjectId(input.barberId);

		const match: any = { barberId: barberId };

		const ymd: string | undefined =
			input?.ymd?.trim?.() ?? (input?.reserveDay ? ymdInSeoul(new Date(input.reserveDay)) : undefined);

		if (ymd) {
			const { start, end } = kstDayWindow(ymd, 9, 20); // 09:00–20:00 KST → UTC Date
			match.reserveTime = { $gte: start, $lt: end };
		}

		// 3) SORT
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		// 5) PIPELINE
		const pipeline: PipelineStage[] = [
			{ $match: match } as PipelineStage,
			{ $sort: sort } as PipelineStage,
			{
				$facet: {
					list: [
						lookupUser as PipelineStage,
						{ $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } } as PipelineStage,
					] as unknown as PipelineStage[],

					metaCounter: [{ $count: 'total' }] as unknown as PipelineStage[],
				},
			} as PipelineStage,
		];

		const res = await this.reserveModel.aggregate(pipeline).exec();
		if (!res?.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return res[0];
	}

	public async updateReservation(barberId: ObjectId, input: ReserveUpdate): Promise<Reservation> {
		const { reservationId, reserveStatus } = input;

		// COMMENT: map input status into actual ReserveStatus
		const nextStatus = reserveStatus === ReserveStatus.FINISH ? ReserveStatus.FINISH : ReserveStatus.NOSHOW;

		// COMMENT: update only if this reservation:
		// - belongs to barber
		// - is currently BOOKED (not already finished / cancelled / no-show)
		const reservation = await this.reserveModel
			.findOneAndUpdate(
				{
					_id: reservationId,
					barberId,
					reserveStatus: ReserveStatus.BOOKED,
				},
				{
					$set: {
						reserveStatus: nextStatus,
					},
				},
				{ new: true, runValidators: true },
			)
			.lean()
			.exec();

		if (!reservation) {
			// not found, belongs to another barber, or no longer BOOKED
			throw new BadRequestException('Reservation cannot be updated');
		}

		// Common values for post-actions
		const userId = reservation.reserveRefId; // COMMENT: user who booked the reservation
		const reservationObjectId = reservation._id;

		// If finished, give barber 1 point and notify user to rate service
		if (nextStatus === ReserveStatus.FINISH) {
			// give +1 point to barber (adjust targetKey to your actual field)
			await this.memberService.memberStatsEditor({
				_id: barberId,
				targetKey: 'memberPoints',
				modifier: 1,
			});

			await this.notificationService.createRateServiceNotification({
				barberId,
				userId: reservation.reserveRefId,
				reservationId: reservation._id,
			});
		}

		// If no-show, increase memberWarnings and block at 3+
		if (nextStatus === ReserveStatus.NOSHOW) {
			const user = await this.memberService.memberStatsEditor({
				_id: userId,
				targetKey: 'memberWarnings',
				modifier: 1,
			});

			if ((user?.memberWarnings ?? 0) >= 3 && user.memberStatus !== MemberStatus.BLOCK) {
				await this.memberModel.updateOne({ _id: user._id }, { $set: { memberStatus: MemberStatus.BLOCK } });
			}
		}

		return reservation as unknown as Reservation;
	}

	public async getAllBarberSchedules(input?: AllBarberScheduleInquiry): Promise<Reservations> {
		const query = input ?? ({} as AllBarberScheduleInquiry);

		// BASE MATCH: no filters; admin sees every reservation
		const match: T = {};

		// SORT
		const sort: T = { [query.sort ?? 'createdAt']: query.direction ?? Direction.DESC };

		// PIPELINE
		const pipeline: PipelineStage[] = [
			{ $match: match } as PipelineStage,
			{ $sort: sort } as PipelineStage,
			{
				$facet: {
					list: [
						lookupBarber as PipelineStage,
						{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } } as PipelineStage,
						{ $set: { barberData: '$memberData' } } as PipelineStage,
					] as PipelineStage[],

					metaCounter: [{ $count: 'total' }] as unknown as PipelineStage[],
				},
			} as PipelineStage,
		];

		try {
			const res = await this.reserveModel.aggregate(pipeline).exec();
			const result = res?.[0] ?? { list: [], metaCounter: [] };
			return result;
		} catch (err) {
			console.error('getAllBarberSchedules error:', err);
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}
}
