import { Module } from '@nestjs/common';
import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import { MongooseModule } from '@nestjs/mongoose';
import ReserveSchema from '../../schemas/Reservation.model';
import { AuthModule } from '../auth/auth.module';
import MemberSchema from '../../schemas/Member.model';
import { MemberModule } from '../member/member.module';
import ServiceSchema from '../../schemas/Service.model';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Reservation', schema: ReserveSchema },
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Service', schema: ServiceSchema },
		]),
		AuthModule,
		MemberModule,
		NotificationModule,
	],
	providers: [ReservationResolver, ReservationService],
})
export class ReservationModule {}
