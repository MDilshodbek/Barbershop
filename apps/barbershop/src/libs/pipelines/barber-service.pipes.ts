import type { PipelineStage } from 'mongoose';

// reusable aggregation fragments for barber services
export const lookupBarber: PipelineStage = {
	$lookup: {
		from: 'members',
		localField: 'barberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupNoticeMember = {
	$lookup: {
		from: 'members',
		localField: 'receiverId',
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupUser: PipelineStage = {
	$lookup: {
		from: 'members',
		localField: 'reserveRefId',
		foreignField: '_id',
		as: 'clientData',
	},
};

export const lookupService: PipelineStage = {
	$lookup: {
		from: 'services',
		localField: 'serviceId',
		foreignField: '_id',
		as: 'serviceData',
	},
};
