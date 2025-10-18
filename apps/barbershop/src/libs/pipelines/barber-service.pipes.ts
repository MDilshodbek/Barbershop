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

export const lookupUser: PipelineStage = {
	$lookup: {
		from: 'members',
		localField: 'reserveRefId',
		foreignField: '_id',
		as: 'clientData',
	},
};

export const shapeBarberServiceEffectiveCore: PipelineStage[] = [
	{
		$lookup: {
			from: 'services',
			localField: 'serviceId',
			foreignField: '_id',
			as: 'base',
		},
	},
	{ $unwind: { path: '$base', preserveNullAndEmptyArrays: false } },
	{
		$addFields: {
			serviceType: '$base.serviceType',
			effectiveStatus: { $ifNull: ['$barberServiceStatus', '$base.serviceStatus'] },
			effectivePrice: { $ifNull: ['$barberServicePrice', '$base.servicePrice'] },
			effectiveDuration: { $ifNull: ['$barberServiceDuration', '$base.serviceDuration'] },
			effectiveDesc: { $ifNull: ['$barberServiceDesc', '$base.serviceDesc'] },
			effectiveImages: {
				$cond: [
					{ $gt: [{ $size: { $ifNull: ['$barberServiceImages', []] } }, 0] },
					'$barberServiceImages',
					'$base.serviceImages',
				],
			},
			serviceLikes: { $ifNull: ['$base.serviceLikes', 0] },
			serviceRank: { $ifNull: ['$base.serviceRank', 0] },
		},
	},
];

export const projectBarberServicePublic: PipelineStage = {
	$project: {
		_id: 1,
		barberId: 1,
		serviceId: 1,
		serviceType: 1,
		barberServiceStatus: '$effectiveStatus',
		barberServicePrice: '$effectivePrice',
		barberServiceDuration: '$effectiveDuration',
		serviceLikes: 1,
		serviceRank: 1,
		barberServiceImages: '$effectiveImages',
		barberServiceDesc: '$effectiveDesc',
		barberData: 1,
		createdAt: 1,
		updatedAt: 1,
	},
};

export const lookupBarberServiceEffective: PipelineStage[] = [
	{
		$lookup: {
			from: 'barberservices',
			localField: 'barberServiceId',
			foreignField: '_id',
			as: 'barberServiceData',
			pipeline: [
				{ $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'base' } },
				{ $unwind: { path: '$base', preserveNullAndEmptyArrays: true } },
				{
					$addFields: {
						serviceType: '$base.serviceType',
						effectiveStatus: { $ifNull: ['$barberServiceStatus', '$base.serviceStatus'] },
						effectivePrice: { $ifNull: ['$barberServicePrice', '$base.servicePrice'] },
						effectiveDuration: { $ifNull: ['$barberServiceDuration', '$base.serviceDuration'] },
						effectiveDesc: { $ifNull: ['$barberServiceDesc', '$base.serviceDesc'] },
						effectiveImages: {
							$cond: [
								{ $gt: [{ $size: { $ifNull: ['$barberServiceImages', []] } }, 0] },
								'$barberServiceImages',
								'$base.serviceImages',
							],
						},
						serviceLikes: { $ifNull: ['$base.serviceLikes', 0] },
						serviceRank: { $ifNull: ['$base.serviceRank', 0] },
					},
				},
				{
					$project: {
						_id: 1,
						barberId: 1,
						serviceId: 1,
						serviceType: 1,
						barberServiceStatus: '$effectiveStatus',
						barberServicePrice: '$effectivePrice',
						barberServiceDuration: '$effectiveDuration',
						barberServiceDesc: '$effectiveDesc',
						barberServiceImages: '$effectiveImages',
						serviceLikes: 1,
						serviceRank: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				},
			],
		},
	},
];
