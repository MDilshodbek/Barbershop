import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BarberCutService } from './barber-services.service';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BarberServiceInput, BarberServiceInquiry } from '../../libs/dto/barber-service/b-services.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { BCutServices, BCutService } from '../../libs/dto/barber-service/b-services';
import { BarberServiceUpdateInput } from '../../libs/dto/barber-service/b-services.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';

@Resolver()
export class BarberServicesResolver {
	constructor(private readonly barberService: BarberCutService) {}

	@Roles(MemberType.BARBER, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BCutService)
	public async createBarberService(
		@Args('input') input: BarberServiceInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BCutService> {
		console.log('Mutation: createBarberService');
		input.barberId = memberId;

		return await this.barberService.createBarberService(input);
	}

	@Roles(MemberType.BARBER, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BCutService)
	public async updateBarberService(
		@Args('input') input: BarberServiceUpdateInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BCutService> {
		console.log('Mutation: updateBarberService');
		input._id = shapeIntoMongoObjectId(input._id);

		return await this.barberService.updateBarberService(input, memberId);
	}

	@Roles(MemberType.BARBER, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Boolean)
	public async removeBarberService(@Args('_id') _id: string, @AuthMember('_id') memberId: ObjectId): Promise<boolean> {
		console.log('Mutation: removeBarberService');
		return await this.barberService.removeBarberService(_id, memberId);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => BCutService)
	public async getBarberService(@Args('id') id: string): Promise<BCutService> {
		console.log('Query: getBarberService');
		const serviceId = shapeIntoMongoObjectId(id);
		return await this.barberService.getBarberService(serviceId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => [BCutServices])
	public async getAllBarberServices(
		@Args('input', { nullable: true }) input: BarberServiceInquiry,
	): Promise<BCutServices[]> {
		console.log('Query: getBarberServices');
		return await this.barberService.getAllBarberServices(input);
	}

	@Roles(MemberType.BARBER, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => [BCutServices])
	public async getOneBarberServices(
		@Args('input', { nullable: true }) input: BarberServiceInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BCutServices[]> {
		console.log('Query: getBarberServices');
		return await this.barberService.getOneBarberServices(memberId, input);
	}
}
