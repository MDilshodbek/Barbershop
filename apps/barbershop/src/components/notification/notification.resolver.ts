import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@Mutation(() => Boolean)
	async markNotificationRead(
		@AuthMember('_id') memberId: ObjectId,
		@Args('notificationId', { type: () => String }) notificationId: string,
	): Promise<boolean> {
		return this.notificationService.markNotificationAsRead({
			notificationId: notificationId as any,
			memberId,
		});
	}

	@Mutation(() => Int)
	async markAllNotificationsRead(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		return this.notificationService.markAllNotificationsAsRead(memberId);
	}
}
