import { Schema } from 'mongoose';
import { ServiceStatus } from '../libs/enums/service.enum';

const BarberServiceSchema = new Schema(
	{
		barberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },

		serviceId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Service',
		},

		barberServiceStatus: {
			type: String,
			enum: ServiceStatus,
			default: ServiceStatus.ACTIVE,
		},

		barberServicePrice: {
			type: Number,
		},

		barberServiceDuration: {
			type: Number,
		},

		barberServiceImages: {
			type: [String],
		},

		barberServiceDesc: {
			type: String,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true },
);

BarberServiceSchema.index({ barberId: 1, serviceId: 1 }, { unique: true });

export default BarberServiceSchema;
