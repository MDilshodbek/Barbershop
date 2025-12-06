import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Review, Reviews } from '../../libs/dto/review/review';
import { AllReviewInquiry, ReviewInput, ReviewInquiry } from '../../libs/dto/review/review.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ReviewUpdate } from '../../libs/dto/review/review.update';
import { ReviewGroup, ReviewStatus } from '../../libs/enums/review.enum';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/pipelines/barber-service.pipes';
import { CutServicesService } from '../cut-services/cut-services.service';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReviewService {
	constructor(
		@InjectModel('Review') private readonly reviewModel: Model<Review>,
		private readonly cutService: CutServicesService,
		private readonly memberService: MemberService,
		private readonly notificationService: NotificationService,
	) {}

	public async createReview(memberId: ObjectId, input: ReviewInput): Promise<Review> {
		input.memberId = memberId;

		let result = null;
		try {
			result = await this.reviewModel.create(input);
		} catch (error) {
			console.log('Error, ReviewModel:', error.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		let receiverId: ObjectId | null = null;

		switch (input.reviewGroup) {
			case ReviewGroup.SERVICE:
				await this.cutService.serviceStatsEditor({
					_id: input.reviewRefId,
					targetKey: 'serviceReviews',
					modifier: 1,
				});
				break;
			case ReviewGroup.MEMBER:
				await this.memberService.memberStatsEditor({
					_id: input.reviewRefId,
					targetKey: 'memberReviews',
					modifier: 1,
				});
				receiverId = input.reviewRefId as ObjectId;
				break;
		}

		if (receiverId) {
			await this.notificationService.createReviewNotification({
				receiverId,
				authorId: memberId,
				reviewId: result._id as ObjectId,
			});
		}

		return result;
	}

	public async updateReview(memberId: ObjectId, input: ReviewUpdate): Promise<Review> {
		const { _id } = input;

		const result = await this.reviewModel
			.findOneAndUpdate({ _id: _id, memberId: memberId, reviewStatus: ReviewStatus.ACTIVE }, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async getReviews(memberId: ObjectId, input: ReviewInquiry): Promise<Reviews> {
		const { reviewRefId } = input.search;
		const match: T = { reviewRefId: reviewRefId, reviewStatus: ReviewStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Reviews[] = await this.reviewModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getAllReviews(memberId: ObjectId, input: AllReviewInquiry): Promise<Reviews> {
		const match: T = { reviewStatus: ReviewStatus.ACTIVE };

		const result: Reviews[] = await this.reviewModel
			.aggregate([
				{ $match: match },
				{ $sort: { rating: -1, createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	// Admin
	public async removeReviewByAdmin(reviewId: ObjectId): Promise<Review> {
		const result = await this.reviewModel.findByIdAndDelete(reviewId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
