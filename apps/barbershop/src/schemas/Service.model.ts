import { Schema } from 'mongoose';
import { ServiceStatus, ServiceType } from '../libs/enums/service.enum';

const ServiceSchema = new Schema(
	{
		serviceType: {
			type: String,
			enum: ServiceType,
		},

		serviceStatus: {
			type: String,
			enum: ServiceStatus,
			default: ServiceStatus.ACTIVE,
		},

		serviceTitle: {
			type: String,
			index: { unique: true, sparse: true },
			required: true,
		},

		serviceDuration: {
			type: Number,
			require: true,
		},

		servicePrice: {
			type: Number,
			required: true,
		},

		serviceImages: {
			type: [String],
			required: true,
		},

		serviceDesc: {
			type: String,
		},

		serviceReviews: {
			type: Number,
			default: 0,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'services' },
);

ServiceSchema.index({ serviceType: 1, serviceTitle: 1 }, { unique: true });

export default ServiceSchema;
