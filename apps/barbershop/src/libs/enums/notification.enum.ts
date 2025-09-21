import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	APPOINTMENT = 'APPOINTMENT',
	REVIEW = 'REVIEW',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	APPOINTMENT = 'APPOINTMENT',
	REVIEW = 'REVIEW',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
