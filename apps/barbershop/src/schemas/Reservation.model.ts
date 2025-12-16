import { Schema } from 'mongoose';
import { ReserveStatus } from '../libs/enums/reservation.enum';

const ReserveSchema = new Schema(
	{
		reserveStatus: {
			type: String,
			enum: ReserveStatus,
			default: ReserveStatus.BOOKED,
		},

		barberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		reserveRefId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		reserveTime: {
			type: Date,
			required: true,
		},

		reserveEndTime: {
			type: Date,
			required: true,
		},

		reserveDay: {
			type: Date,
			required: true,
		},

		serviceId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Services',
		},

		serviceTitle: {
			type: String,
			required: true,
		},

		servicePrice: {
			type: Number,
			required: true,
		},

		serviceDurationMin: {
			type: Number,
			required: true,
		},

		reserveNotes: {
			type: String,
		},

		cancelReason: { type: String },
		cancelledAt: { type: Date },
		cancelledById: { type: Schema.Types.ObjectId, ref: 'Member' },
	},
	{ timestamps: true, collection: 'reservation' },
);

ReserveSchema.index(
	{ barberId: 1, reserveTime: 1 },
	{
		unique: true,
		partialFilterExpression: {
			reserveStatus: ReserveStatus.BOOKED,
		},
	},
);

ReserveSchema.index(
	{ reserveRefId: 1, reserveTime: 1 },
	{
		unique: true,
		partialFilterExpression: {
			reserveStatus: ReserveStatus.BOOKED,
		},
	},
);

export default ReserveSchema;
