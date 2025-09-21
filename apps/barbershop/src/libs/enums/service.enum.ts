import { registerEnumType } from '@nestjs/graphql';

export enum ServiceType {
	CUT = 'CUT',
	BEARD = 'BEARD',
	MODELING = 'MODELING',
	WASH = 'WASH',
	LONG = 'LONG',
	CHILDREN = 'CHILDREN',
	PERM = 'PERM',
	COLOR = 'COLOR',
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
