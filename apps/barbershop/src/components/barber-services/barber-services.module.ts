import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BarberServicesResolver } from './barber-services.resolver';
import BarberServiceSchema from '../../schemas/BarberServices.model';
import { AuthModule } from '../auth/auth.module';
import { BarberCutService } from './barber-services.service';
import { MemberModule } from '../member/member.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'BarberService', schema: BarberServiceSchema }]),
		AuthModule,
		MemberModule,
	],
	providers: [BarberServicesResolver, BarberCutService],
	exports: [BarberCutService],
})
export class BarberServicesModule {}
