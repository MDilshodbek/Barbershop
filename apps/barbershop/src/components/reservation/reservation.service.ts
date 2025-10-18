import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { Reservation, Reservations } from '../../libs/dto/reservation/reservation';
import {
	BarberScheduleInquiry,
	CancelReservationInput,
	ReserveInput,
	ReserveInquiry,
} from '../../libs/dto/reservation/reservation.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import * as moment from 'moment';
import { ReserveStatus } from '../../libs/enums/reservation.enum';
import { BCutService } from '../../libs/dto/barber-service/b-services';
import { ServiceType } from '../../libs/enums/service.enum';
import { Member } from '../../libs/dto/member/member';
import { MemberService } from '../member/member.service';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Service } from '../../libs/dto/service/service';
import { T } from '../../libs/types/common';
import { lookupBarberServiceEffective, lookupBarber, lookupUser } from '../../libs/pipelines/barber-service.pipes';
import { kstDayWindow, seoulDayWindowUTC, seoulHourMinute, toKstYMD, ymdInSeoul } from '../../libs/config';

@Injectable()
export class ReservationService {
	constructor(
		@InjectModel('Reservation') private readonly reserveModel: Model<Reservation>,
		@InjectModel('BarberService') private readonly bServicesModel: Model<BCutService>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Service') private readonly servicesModel: Model<Service>,
		private memberService: MemberService,
	) {}

	private async getEffectiveDurationMin(barberServiceId: ObjectId, barberId: ObjectId): Promise<number> {
		// UNCHANGED
		const bsvc = await this.bServicesModel
			.findOne({ _id: barberServiceId, barberId })
			.select('_id barberId serviceId barberServiceDuration')
			.lean()
			.exec();
		if (!bsvc) throw new BadRequestException('This service does not belong to the selected barber');

		let minutes = bsvc.barberServiceDuration;
		if (minutes == null) {
			const base = await this.servicesModel.findById(bsvc.serviceId).select('serviceDuration').lean().exec();
			minutes = base?.serviceDuration;
		}

		if (typeof minutes !== 'number' || minutes <= 0) {
			throw new BadRequestException('Service duration not defined');
		}
		return Math.trunc(minutes);
	}

	public async createReservation(input: ReserveInput): Promise<Reservation> {
		const { barberId, barberServiceId, reserveRefId, reserveTime } = input;
		console.log('input:', input);

		// UNCHANGED: upfront guard
		if (!barberId || !barberServiceId || !reserveTime || !reserveRefId) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		// CHANGED: parse client time as Date; we will validate against Seoul time
		const start = new Date(reserveTime);
		if (isNaN(start.getTime())) throw new BadRequestException('Invalid reserveTime');

		const now = new Date();
		if (start.getTime() <= now.getTime()) {
			throw new BadRequestException('Reservation must be in the future');
		}

		// ADDED: compute day (Seoul) and day window (UTC) for validation and storage
		const ymd = ymdInSeoul(start);
		const { startUtc: dayStartUtc, endUtc: dayEndUtc } = seoulDayWindowUTC(ymd, 9, 20);

		// ADDED: validate start inside 09:00–20:00 Seoul
		const { h: startH, m: startM } = seoulHourMinute(start);
		if (startH < 9 || startH >= 20) {
			throw new BadRequestException('Reservation must start between 09:00 and 20:00 (Seoul time)');
		}

		// UNCHANGED: verify the service belongs to the selected barber
		const bService = await this.bServicesModel
			.findOne({ _id: barberServiceId, barberId })
			.select('_id barberId')
			.lean()
			.exec();
		if (!bService) throw new BadRequestException('This service does not belong to the selected barber');

		// ADDED: get effective duration and compute end time
		const durationMin = await this.getEffectiveDurationMin(barberServiceId, barberId);
		const end = new Date(start.getTime() + durationMin * 60000);

		// ADDED: ensure END does not go past 20:00 Seoul
		const { h: endH, m: endM } = seoulHourMinute(end);
		// if end time is 20:00 or later, it violates the window
		if (endH > 20 || (endH === 20 && endM > 0)) {
			throw new BadRequestException('Reservation must end by 20:00 (Seoul time)');
		}

		// ADDED: ensure the whole interval sits within today’s Seoul window (defensive)
		if (start < dayStartUtc || end > dayEndUtc) {
			throw new BadRequestException('Reservation must be within 09:00–20:00 for the selected day (Seoul time)');
		}

		// CHANGED: compute reserveDay as midnight of the same Seoul day (stored in UTC)
		const reserveDayKst = new Date(`${ymd}T00:00:00+09:00`);
		const reserveDayUtc = new Date(reserveDayKst.toISOString());

		// CHANGED: block overlap with active reservations inside the same day window
		const conflict = await this.reserveModel
			.findOne({
				barberId,
				reserveStatus: { $in: [ReserveStatus.BOOKED, ReserveStatus.CONFIRMED] }, // keep your active set
				reserveTime: { $lt: end },
				reserveEndTime: { $gt: start },
			})
			.select('_id reserveTime reserveEndTime')
			.lean()
			.exec();

		if (conflict) throw new BadRequestException('Selected time is not available');

		try {
			// CHANGED: persist normalized fields
			const doc = await this.reserveModel.create({
				...input,
				reserveTime: start, // original start instant
				reserveEndTime: end, // computed end instant
				reserveDay: reserveDayUtc, // midnight of the same Seoul day (UTC)
				serviceDurationMin: durationMin, // computed duration
			});
			return doc;
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// ADDED: list barbers who offer a given service type
	public async listBarbersByServiceType(serviceType: ServiceType) {
		return await this.bServicesModel
			.aggregate([
				{ $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'base' } },
				{ $unwind: '$base' },
				{ $match: { 'base.serviceType': serviceType, barberServiceStatus: 'ACTIVE' } },
				{ $group: { _id: '$barberId' } },
			])
			.exec();
	}

	// ADDED: list services for a given barber
	public async listServicesByBarber(barberId: ObjectId) {
		return await this.bServicesModel
			.aggregate([
				{ $match: { barberId, barberServiceStatus: 'ACTIVE' } },
				{ $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'base' } },
				{ $unwind: '$base' },
				{ $project: { _id: 1, serviceId: 1, 'base.serviceTitle': 1, 'base.serviceType': 1 } },
			])
			.exec();
	}

	public async cancelReservation(input: CancelReservationInput, memberId: ObjectId): Promise<Reservation> {
		const { reservationId, reason } = input;

		// fetch reservation
		const reservation = await this.reserveModel
			.findById(reservationId)
			.select('_id reserveStatus reserveRefId barberId reserveTime reserveDay')
			.lean()
			.exec();
		if (!reservation) throw new BadRequestException('Reservation not found');

		// only cancellable states
		if (![ReserveStatus.BOOKED, ReserveStatus.CONFIRMED].includes(reservation.reserveStatus)) {
			throw new BadRequestException('Reservation cannot be cancelled');
		}

		// set CANCELLED
		const updated = await this.reserveModel
			.findOneAndUpdate(
				{ _id: reservationId, reserveStatus: { $in: [ReserveStatus.BOOKED, ReserveStatus.CONFIRMED] } },
				{
					$set: {
						reserveStatus: ReserveStatus.CANCELLED,
						cancelReason: reason ?? null,
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
			// CHANGED: use your memberStatsEditor to add +1 to memberWarnings
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

		return updated;
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

							...lookupBarberServiceEffective, // PipelineStage[]
							{ $unwind: { path: '$barberServiceData', preserveNullAndEmptyArrays: true } } as PipelineStage,
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

		// 4) OPTIONAL
		const textStage: PipelineStage[] = input?.text?.trim()
			? [{ $match: { 'clientData.memberNick': { $regex: new RegExp(input.text.trim(), 'i') } } } as PipelineStage]
			: [];

		// 5) PIPELINE
		const pipeline: PipelineStage[] = [
			{ $match: match } as PipelineStage,
			{ $sort: sort } as PipelineStage,
			{
				$facet: {
					list: [
						{ $skip: (input.page - 1) * input.limit },
						{ $limit: input.limit },

						lookupUser as PipelineStage,
						{ $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } } as PipelineStage,

						...lookupBarberServiceEffective,
						{ $unwind: { path: '$barberServiceData', preserveNullAndEmptyArrays: true } } as PipelineStage,

						...textStage,
					] as unknown as PipelineStage[],

					metaCounter: [{ $count: 'total' }] as unknown as PipelineStage[],
				},
			} as PipelineStage,
		];

		const res = await this.reserveModel.aggregate(pipeline).exec();
		if (!res?.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return res[0];
	}
}
