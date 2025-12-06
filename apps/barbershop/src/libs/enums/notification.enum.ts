import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	FOLLOW = 'FOLLOW',
	APPOINTMENT = 'APPOINTMENT',
	COMMENT = 'COMMENT',
	REVIEW = 'REVIEW',
	RATE_SERVICE = 'RATE_SERVICE',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	UNREAD = 'UNREAD',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});
