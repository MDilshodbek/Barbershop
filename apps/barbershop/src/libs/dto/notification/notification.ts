import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { NotificationStatus, NotificationType } from '../../enums/notification.enum';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => NotificationStatus)
	notificationStatus: NotificationStatus;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field(() => String)
	notificationMessage: string;

	@Field(() => String)
	authorId: ObjectId;

	@Field(() => String)
	receiverId: ObjectId;

	@Field(() => String)
	entityId: ObjectId;

	@Field(() => Date, { nullable: true })
	readAt: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => GraphQLJSON, { nullable: true })
	entityData?: any;
}

@ObjectType()
export class Notifications {
	@Field(() => [Notification])
	list: Notification[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
