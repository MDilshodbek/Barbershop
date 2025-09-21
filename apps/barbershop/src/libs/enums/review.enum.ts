import { registerEnumType } from '@nestjs/graphql';

export enum ReviewStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(ReviewStatus, {
	name: 'ReviewStatus',
});

export enum ReviewGroup {
	MEMBER = 'MEMBER',
}
registerEnumType(ReviewGroup, {
	name: 'ReviewGroup',
});
