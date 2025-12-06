import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationMessage } from '../../libs/enums/common.enum';

@Injectable()
export class NotificationService {
	logger: any;
	constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

	async createAppointmentNotification(params: {
		barberId: ObjectId;
		memberId: ObjectId;
		appointmentId: ObjectId;
	}): Promise<void> {
		const { barberId, memberId, appointmentId } = params;

		try {
			await this.notificationModel.create({
				receiverId: barberId, // COMMENT: barber receives
				authorId: memberId, // COMMENT: who booked
				notificationType: NotificationType.APPOINTMENT,
				notificationMessage: NotificationMessage.APPOINTMENT_CREATED,
				entityId: appointmentId,
				notificationStatus: NotificationStatus.UNREAD,
			});
		} catch (error) {
			this.logger.error(`createAppointmentNotification failed: ${error?.message}`);
		}
	}

	async createCancelledReservationNotification(params: {
		barberId: ObjectId;
		memberId: ObjectId;
		appointmentId: ObjectId;
	}): Promise<void> {
		const { barberId, memberId, appointmentId } = params;

		try {
			await this.notificationModel.create({
				receiverId: barberId,
				authorId: memberId,
				notificationType: NotificationType.APPOINTMENT,
				notificationMessage: NotificationMessage.APPOINTMENT_CANCELLED,
				entityId: appointmentId,
				notificationStatus: NotificationStatus.UNREAD,
			});
		} catch (error) {
			this.logger.error(`createCancelledReservationNotification failed: ${error?.message}`);
		}
	}

	async createReviewNotification(params: {
		receiverId: ObjectId;
		authorId: ObjectId;
		reviewId: ObjectId;
	}): Promise<void> {
		const { receiverId, authorId, reviewId } = params;

		await this.notificationModel.create({
			receiverId,
			authorId,
			notificationType: NotificationType.REVIEW,
			notificationMessage: NotificationMessage.REVIEW_CREATED,
			entityId: reviewId,
			notificationStatus: NotificationStatus.UNREAD,
		});
	}

	async createCommentNotification(params: {
		receiverId: ObjectId;
		authorId: ObjectId;
		commentId: ObjectId;
	}): Promise<void> {
		const { receiverId, authorId, commentId } = params;

		try {
			await this.notificationModel.create({
				receiverId,
				authorId,
				notificationType: NotificationType.COMMENT,
				notificationMessage: NotificationMessage.COMMENT_CREATED,
				entityId: commentId,
				notificationStatus: NotificationStatus.UNREAD,
			});
		} catch (error) {
			this.logger.error(`createReviewNotification failed: ${error?.message}`);
		}
	}

	async createSubscribeNotification(params: {
		receiverId: ObjectId;
		authorId: ObjectId;
		subscriptionId: ObjectId;
	}): Promise<void> {
		const { receiverId, authorId, subscriptionId } = params;
		try {
			await this.notificationModel.create({
				receiverId,
				authorId,
				notificationType: NotificationType.FOLLOW,
				notificationMessage: NotificationMessage.FOLLOW_CREATED,
				entityId: subscriptionId,
				notificationStatus: NotificationStatus.UNREAD,
			});
		} catch (error) {
			this.logger.error(`createSubscribeNotification failed: ${error?.message}`);
		}
	}

	async createRateServiceNotification(params: {
		barberId: ObjectId;
		userId: ObjectId;
		reservationId: ObjectId;
	}): Promise<void> {
		const { barberId, userId, reservationId } = params;

		// create notification document
		await this.notificationModel.create({
			notificationType: NotificationType.RATE_SERVICE,
			notificationStatus: NotificationStatus.UNREAD,
			notificationMessage: NotificationMessage.REVIEW_REQUEST,
			authorId: barberId,
			receiverId: userId,
			entityId: reservationId,
		});
	}

	async markNotificationAsRead(params: { notificationId: ObjectId; memberId: ObjectId }): Promise<boolean> {
		const { notificationId, memberId } = params;

		const result = await this.notificationModel.updateOne(
			{
				_id: notificationId,
				receiverId: memberId,
				notificationStatus: NotificationStatus.UNREAD,
			},
			{
				$set: {
					notificationStatus: NotificationStatus.READ,
					readAt: new Date(),
				},
			},
		);

		const modified = (result as any).modifiedCount ?? (result as any).nModified ?? 0;

		return modified > 0;
	}

	async markAllNotificationsAsRead(memberId: ObjectId): Promise<number> {
		const result = await this.notificationModel.updateMany(
			{
				receiverId: memberId,
				notificationStatus: NotificationStatus.UNREAD,
			},
			{
				$set: {
					notificationStatus: NotificationStatus.READ,
					readAt: new Date(),
				},
			},
		);

		const modified = (result as any).modifiedCount ?? (result as any).nModified ?? 0;

		return modified;
	}
}
