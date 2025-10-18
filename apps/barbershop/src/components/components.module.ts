import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { ReviewModule } from './review/review.module';
import { CutServicesModule } from './cut-services/cut-services.module';
import { BarberServicesModule } from './barber-services/barber-services.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		CutServicesModule,
		ReviewModule,
		ReservationModule,
		BoardArticleModule,
		CommentModule,
		FollowModule,
		LikeModule,
		ViewModule,
		BarberServicesModule,
	],
})
export class ComponentsModule {}
