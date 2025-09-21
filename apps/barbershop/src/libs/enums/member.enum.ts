import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
	USER = 'USER',
	BARBER = 'BARBER',
	ADMIN = 'ADMIN',
}
registerEnumType(MemberType, { name: 'MemberType' });

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}
registerEnumType(MemberStatus, { name: 'MemberStatus' });

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	GOOGLE = 'GOOGLE',
	KAKAOTALK = 'KAKAOTALK',
}
registerEnumType(MemberAuthType, { name: 'MemberAuthType' });

export enum MemberLevel {
	JUNIOR = 'JUNIOR',
	SENIOR = 'SENIOR',
	MASTER = 'MASTER',
}

registerEnumType(MemberLevel, { name: 'MemberLevel' });
