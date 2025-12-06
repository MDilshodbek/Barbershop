import { Module } from '@nestjs/common';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import { MongooseModule } from '@nestjs/mongoose';
import ReviewSchema from '../../schemas/Review.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { CutServicesModule } from '../cut-services/cut-services.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Review', schema: ReviewSchema }]),
		AuthModule,
		MemberModule,
		CutServicesModule,
		NotificationModule,
	],
	providers: [ReviewResolver, ReviewService],
})
export class ReviewModule {}
