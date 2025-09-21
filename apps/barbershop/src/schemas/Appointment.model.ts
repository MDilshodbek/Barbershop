import { Schema } from 'mongoose';
import { AppointStatus } from '../libs/enums/appoint.enum';

const AppointSchema = new Schema({
	appointStatus: {
		type: String,
		enum: AppointStatus,
		default: AppointStatus.BOOKED,
	},

	memberId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Member',
	},

	appointServiceType: {
		type: [Schema.Types.ObjectId],
		ref: 'Service',
		default: [],
	},

	appointRefId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'Member',
	},

	appointTime: {
		type: Date,
		required: true,
	},

	appointDay: {
		type: Date,
		required: true,
	},

	appointNotes: {
		type: String,
	},
});

AppointSchema.index({ memberId: 1, appointRefId: 1, appointTime: 1 }, { unique: true });
AppointSchema.index({ appointRefId: 1, appointTime: 1 });

export default AppointSchema;
