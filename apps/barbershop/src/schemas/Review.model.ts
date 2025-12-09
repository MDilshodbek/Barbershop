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

export default ReviewSchema;
