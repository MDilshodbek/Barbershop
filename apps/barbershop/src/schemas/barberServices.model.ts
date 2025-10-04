import { Schema } from 'mongoose';
import { ServiceStatus } from '../libs/enums/service.enum';

const BarberServiceSchema = new Schema({
	barberId: { type: Schema.Types.ObjectId, ref: 'Barber', required: true },

	serviceType: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Service',
	},

	serviceStatus: {
		type: String,
		enum: ServiceStatus,
		default: ServiceStatus.ACTIVE,
	},

	servicePrice: {
		type: Number,
		required: true,
	},

	serviceDuration: {
		type: Number,
		required: true,
	},
});

BarberServiceSchema.index({ barberId: 1, serviceId: 1 }, { unique: true });

export default BarberServiceSchema;
