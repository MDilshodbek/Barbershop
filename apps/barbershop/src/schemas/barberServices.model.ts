import { Schema } from 'mongoose';
import { ServiceStatus } from '../libs/enums/service.enum';

const BarberServiceSchema = new Schema({
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

export default BarberServiceSchema;
