import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Service, Services } from '../../libs/dto/service/service';
import { ServiceInput, ServiceInquiry } from '../../libs/dto/service/service.input';
import { Message } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ServiceStatus } from '../../libs/enums/service.enum';
import { ServiceUpdate } from '../../libs/dto/service/service.update';

@Injectable()
export class CutServicesService {
	constructor(@InjectModel('Services') private readonly servicesModel: Model<Service>) {}

	public async createService(input: ServiceInput): Promise<Service> {
		try {
			const result = await this.servicesModel.create(input);

			return result;
		} catch (error) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getService(serviceId: ObjectId): Promise<Service> {
		const search: T = {
			_id: serviceId,
			serviceStatus: ServiceStatus.ACTIVE,
		};

		const targetService: Service = await this.servicesModel.findOne(search).lean().exec();
		if (!targetService) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return targetService;
	}

	public async updateService(input: ServiceUpdate): Promise<Service> {
		const { _id, serviceStatus, ...rest } = input;

		const current = await this.servicesModel.findById(_id).select('serviceStatus').lean().exec();
		if (!current) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		// ADDED: compute next status
		const nextStatus =
			serviceStatus ?? (current.serviceStatus === ServiceStatus.ACTIVE ? ServiceStatus.INACTIVE : ServiceStatus.ACTIVE);

		const setDoc = { ...rest, serviceStatus: nextStatus };

		const result = await this.servicesModel
			.findOneAndUpdate({ _id }, { $set: setDoc }, { new: true, runValidators: true })
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getServices(input: ServiceInquiry): Promise<Services> {
		const text = input?.text?.trim();
		const match: T = { serviceStatus: ServiceStatus.ACTIVE };

		if (text) match.serviceTitle = { $regex: new RegExp(text, 'i') };

		const result = await this.servicesModel
			.aggregate([
				{ $match: match },
				{ $sort: { displayOrder: 1, _id: 1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async removeService(_id: string): Promise<boolean> {
		try {
			const res = await this.servicesModel.deleteOne({ _id }).exec();

			if (!res?.deletedCount) throw new BadRequestException(Message.REMOVE_FAILED);
			return true;
		} catch (error: any) {
			throw new BadRequestException(Message.REMOVE_FAILED);
		}
	}

	public async getAllServicesByAdmin(input: ServiceInquiry): Promise<Services> {
		const match: T = {};

		if (input?.text) match.serviceTitle = { $regex: new RegExp(input?.text, 'i') };
		if (input?.serviceStatus) match.serviceStatus = input?.serviceStatus;

		const result = await this.servicesModel
			.aggregate([
				{ $match: match },
				{ $sort: { displayOrder: 1, _id: 1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async serviceStatsEditor(input: StatisticModifier): Promise<Service> {
		const { _id, targetKey, modifier } = input;
		return await this.servicesModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}
}
