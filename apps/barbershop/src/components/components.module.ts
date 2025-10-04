import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { ReviewModule } from './review/review.module';
import { AppointmentModule } from './appointment/appointment.module';
import { CutServicesModule } from './cut-services/cut-services.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		CutServicesModule,
		ReviewModule,
		AppointmentModule,
		BoardArticleModule,
		CommentModule,
		FollowModule,
		LikeModule,
		ViewModule,
	],
})
export class ComponentsModule {}
