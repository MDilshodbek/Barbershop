import { Schema } from 'mongoose';
import { ReviewGroup, ReviewStatus } from '../libs/enums/review.enum';

const ReviewSchema = new Schema(
	{
		reviewStatus: {
			type: String,
			enum: ReviewStatus,
			default: ReviewStatus.ACTIVE,
		},

		reviewGroup: {
			type: String,
			enum: ReviewGroup,
			required: true,
		},

		reviewContent: {
			type: String,
			required: true,
		},

		reviewRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		appointmentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Appointment',
		},

		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},

		reviewImages: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true, collection: 'reviews' },
);

ReviewSchema.index({ memberId: 1, reviewRefId: 1 }, { unique: true });

export default ReviewSchema;
