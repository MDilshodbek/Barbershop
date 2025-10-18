import { Module } from '@nestjs/common';
import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import { MongooseModule } from '@nestjs/mongoose';
import ReserveSchema from '../../schemas/Reservation.model';
import { AuthModule } from '../auth/auth.module';
import { BarberServicesModule } from '../barber-services/barber-services.module';
import BarberServiceSchema from '../../schemas/BarberServices.model';
import MemberSchema from '../../schemas/Member.model';
import { MemberModule } from '../member/member.module';
import ServiceSchema from '../../schemas/Service.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Reservation', schema: ReserveSchema },
			{ name: 'BarberService', schema: BarberServiceSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Service', schema: ServiceSchema },
		]),
		AuthModule,
		BarberServicesModule,
		MemberModule,
	],
	providers: [ReservationResolver, ReservationService],
})
export class ReservationModule {}
