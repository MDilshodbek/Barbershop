import { registerEnumType } from '@nestjs/graphql';

export enum ServiceType {
	CUT = 'CUT',
	BEARD = 'BEARD',
	MODELING = 'MODELING',
	LONG = 'LONG',
	PERM = 'PERM',
	COLOR = 'COLOR',
	CHILDREN = 'CHILDREN',
	WASH = 'WASH',
	MASSAGE = 'MASSAGE',
}
registerEnumType(ServiceType, {
	name: 'ServiceType',
});

export enum ServiceStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
}
registerEnumType(ServiceStatus, {
	name: 'ServiceStatus',
});
