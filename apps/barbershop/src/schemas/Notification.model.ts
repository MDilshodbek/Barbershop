import { Schema } from 'mongoose';
import { NotificationStatus, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
	{
		notificationType: {
			type: String,
			enum: NotificationType,
			required: true,
		},

		notificationStatus: {
			type: String,
			enum: NotificationStatus,
			default: NotificationStatus.UNREAD,
		},

		notificationMessage: {
			type: String,
		},

		authorId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		receiverId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		entityId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		readAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true, collection: 'notifications' },
);

export default NotificationSchema;
