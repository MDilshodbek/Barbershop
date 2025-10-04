import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { Service } from '../../libs/dto/service/service';
import { ServiceInput } from '../../libs/dto/service/service.input';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class CutServicesService {
	constructor(
		@InjectModel('Services') private readonly servicesModel: Model<Service>,
		private authService: AuthService,
	) {}

	public async createService(input: ServiceInput): Promise<Service> {
		try {
			const result = await this.servicesModel.create(input);

			return result;
		} catch (error) {
			console.log('Error, Service.model:', error.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}
}
