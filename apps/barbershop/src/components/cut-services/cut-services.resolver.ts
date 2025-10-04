import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CutServicesService } from './cut-services.service';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Service } from '../../libs/dto/service/service';
import { ServiceInput } from '../../libs/dto/service/service.input';

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
}
