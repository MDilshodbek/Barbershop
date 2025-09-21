import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ServicesModule } from './services/services.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { ReviewModule } from './review/review.module';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
	imports: [
		MemberModule,
		AuthModule,
		ServicesModule,
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
