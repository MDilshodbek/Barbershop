import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationInquiry } from '../../libs/dto/notification/notification.input';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	async markNotificationRead(
		@AuthMember('_id') memberId: ObjectId,
		@Args('notificationId', { type: () => String }) notificationId: string,
	): Promise<Notification> {
		const noticeId = shapeIntoMongoObjectId(notificationId);
		const receiverId = shapeIntoMongoObjectId(memberId as any);
		return this.notificationService.markNotificationAsRead(receiverId, noticeId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => [Notification])
	async markAllNotificationsRead(@AuthMember('_id') memberId: ObjectId): Promise<Notification[]> {
		return this.notificationService.markAllNotificationsAsRead(memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	async getMemberAllNotifications(
		@AuthMember('_id') memberId: ObjectId,
		@Args('input') input: NotificationInquiry,
	): Promise<Notifications> {
		return this.notificationService.getMemberAllNotifications(memberId, input);
	}
}
