import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, PipelineStage } from 'mongoose';
import { BCutServices, BCutService } from '../../libs/dto/barber-service/b-services';
import { BarberServiceInput, BarberServiceInquiry } from '../../libs/dto/barber-service/b-services.input';
import { Message } from '../../libs/enums/common.enum';
import { BarberServiceUpdateInput } from '../../libs/dto/barber-service/b-services.update';
import { MemberService } from '../member/member.service';
import {
	lookupBarber,
	projectBarberServicePublic,
	shapeBarberServiceEffectiveCore,
} from '../../libs/pipelines/barber-service.pipes';

@Injectable()
export class BarberCutService {
	constructor(
		@InjectModel('BarberService') private readonly bServicesModel: Model<BCutService>,
		private memberService: MemberService,
	) {}

	public async createBarberService(input: BarberServiceInput): Promise<BCutService> {
		const { serviceId, barberId } = input;
		const exists = await this.bServicesModel.exists({ barberId, serviceId });
		if (exists) throw new BadRequestException(Message.DUPLICATE_BARBER_SERVICE);

		try {
			const result = await this.bServicesModel.create(input);
			await this.memberService.memberStatsEditor({ _id: result.barberId, targetKey: 'memberServices', modifier: 1 });

			return result;
		} catch (error) {
			console.log('Error, Service.model:', error.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateBarberService(input: BarberServiceUpdateInput, memberId: ObjectId): Promise<BCutService> {
		const {
			_id,
			barberServicePrice,
			barberServiceDuration,
			barberServiceStatus,
			barberServiceDesc,
			barberServiceImages,
		} = input;

		const patch: Record<string, unknown> = {};
		if (barberServicePrice != null) patch.barberServicePrice = barberServicePrice;
		if (barberServiceDuration != null) patch.barberServiceDuration = barberServiceDuration;
		if (barberServiceStatus != null) patch.barberServiceStatus = barberServiceStatus;
		if (barberServiceDesc != null) patch.barberServiceDesc = barberServiceDesc;
		if (barberServiceImages != null) patch.barberServiceImages = barberServiceImages;

		if (Object.keys(patch).length === 0) {
			throw new BadRequestException(Message.UPDATE_FAILED);
		}

		try {
			const updated = await this.bServicesModel
				.findOneAndUpdate({ _id, barberId: memberId }, { $set: patch }, { new: true })
				.exec();

			if (!updated) throw new BadRequestException(Message.NO_DATA_FOUND);
			return updated;
		} catch (error: any) {
			console.log('Error, Service.model:', error.message);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async removeBarberService(_id: string, memberId: ObjectId): Promise<boolean> {
		try {
			const res = await this.bServicesModel.deleteOne({ _id, barberId: memberId }).exec();
			console.log('res:', res);

			if (!res?.deletedCount) throw new BadRequestException(Message.REMOVE_FAILED);
			return true;
		} catch (error: any) {
			console.log('Error, Service.model:', error.message);
			throw new BadRequestException(Message.REMOVE_FAILED);
		}
	}

	public async getBarberService(_id: ObjectId): Promise<BCutService> {
		try {
			const pipeline: PipelineStage[] = [
				{ $match: { _id } } as PipelineStage,
				...shapeBarberServiceEffectiveCore,
				lookupBarber,
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } } as PipelineStage,
				{ $set: { barberData: '$memberData' } } as PipelineStage,
				projectBarberServicePublic,
			];

			const result = await this.bServicesModel.aggregate(pipeline).exec();
			if (!result?.length) throw new BadRequestException(Message.NO_DATA_FOUND);
			return result[0] as BCutService;
		} catch (e: any) {
			throw new BadRequestException(e?.message ?? Message.BAD_REQUEST);
		}
	}

	public async getAllBarberServices(input?: BarberServiceInquiry): Promise<BCutServices[]> {
		try {
			const textMatch = input?.text?.trim()
				? {
						$or: [
							{ 'base.serviceTitle': { $regex: input.text, $options: 'i' } },
							{ barberServiceDesc: { $regex: input.text, $options: 'i' } },
						],
					}
				: null;

			const listStages: PipelineStage[] = [
				// NOTE: bu API’da paging yo‘q, siz $replaceRoot ishlatyapsiz
				...shapeBarberServiceEffectiveCore,
				...(textMatch ? [{ $match: textMatch } as PipelineStage] : []),
				lookupBarber,
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } } as PipelineStage,
				{ $set: { barberData: '$memberData' } } as PipelineStage,
				projectBarberServicePublic,
				{ $replaceRoot: { newRoot: '$$ROOT' } } as PipelineStage,
			];

			const pipeline: PipelineStage[] = [
				{
					$facet: {
						list: listStages,
						metaCounter: [
							{ $group: { _id: '$barberServiceStatus', total: { $sum: 1 } } } as PipelineStage,
							{ $project: { _id: 0, key: '$_id', total: 1 } } as PipelineStage,
						],
					},
				} as PipelineStage,
			];

			const result = await this.bServicesModel.aggregate(pipeline).exec();
			const { list, metaCounter } = (result?.[0] ?? { list: [], metaCounter: [] }) as any;
			return [{ list, metaCounter }];
		} catch (e: any) {
			throw new BadRequestException(e?.message ?? Message.BAD_REQUEST);
		}
	}

	public async getOneBarberServices(memberId: ObjectId, input?: BarberServiceInquiry): Promise<BCutServices[]> {
		try {
			const textMatch = input?.text?.trim()
				? {
						$or: [
							{ 'base.serviceTitle': { $regex: input.text, $options: 'i' } },
							{ barberServiceDesc: { $regex: input.text, $options: 'i' } },
						],
					}
				: null;

			const listStages: PipelineStage[] = [
				{ $match: { barberId: memberId } } as PipelineStage,
				...shapeBarberServiceEffectiveCore,
				...(textMatch ? [{ $match: textMatch } as PipelineStage] : []),
				lookupBarber,
				{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } } as PipelineStage,
				{ $set: { barberData: '$memberData' } } as PipelineStage,
				projectBarberServicePublic,
				{ $replaceRoot: { newRoot: '$$ROOT' } } as PipelineStage,
			];

			const pipeline: PipelineStage[] = [
				{
					$facet: {
						list: listStages,
						metaCounter: [
							{ $group: { _id: '$barberServiceStatus', total: { $sum: 1 } } } as PipelineStage,
							{ $project: { _id: 0, key: '$_id', total: 1 } } as PipelineStage,
						],
					},
				} as PipelineStage,
			];

			const result = await this.bServicesModel.aggregate(pipeline).exec();
			const { list, metaCounter } = (result?.[0] ?? { list: [], metaCounter: [] }) as any;
			return [{ list, metaCounter }];
		} catch (e: any) {
			throw new BadRequestException(e?.message ?? Message.BAD_REQUEST);
		}
	}
}
