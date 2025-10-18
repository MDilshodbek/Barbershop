import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CutServicesService } from './cut-services.service';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Service, Services } from '../../libs/dto/service/service';
import { ServiceInput, ServiceInquiry } from '../../libs/dto/service/service.input';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ServiceUpdate } from '../../libs/dto/service/service.update';

@Resolver()
export class CutServicesResolver {
	constructor(private readonly cutService: CutServicesService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async createService(@Args('input') input: ServiceInput): Promise<Service> {
		console.log('Mutation: createProperty');

		return await this.cutService.createService(input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Service)
	public async getService(@Args('serviceId') input: string): Promise<Service> {
		console.log('Query: getService');
		const serviceId = shapeIntoMongoObjectId(input);
		return await this.cutService.getService(serviceId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Service)
	public async updateService(@Args('input') input: ServiceUpdate): Promise<Service> {
		console.log('Mutation: updateService');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.cutService.updateService(input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Services)
	public async getServices(@Args('input', { nullable: true }) input?: ServiceInquiry): Promise<Services> {
		console.log('Query: getServices');
		return await this.cutService.getServices(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Boolean)
	public async removeService(@Args('_id') _id: string): Promise<boolean> {
		console.log('Mutation: removeService');
		return await this.cutService.removeService(_id);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Services)
	public async getAllServicesByAdmin(@Args('input', { nullable: true }) input?: ServiceInquiry): Promise<Services> {
		console.log('Query: getServices');
		return await this.cutService.getAllServicesByAdmin(input);
	}
}
