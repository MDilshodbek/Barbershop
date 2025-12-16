import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Review, Reviews } from '../../libs/dto/review/review';
import { AllReviewInquiry, ReviewInput, ReviewInquiry } from '../../libs/dto/review/review.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { ReviewUpdate } from '../../libs/dto/review/review.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class ReviewResolver {
	constructor(private readonly reviewService: ReviewService) {}

	@UseGuards(AuthGuard)
	@Mutation((returns) => Review)
	public async createReview(@Args('input') input: ReviewInput, @AuthMember('_id') memberId: ObjectId): Promise<Review> {
		console.log('Mutation: createReview');
		input.reviewRefId = shapeIntoMongoObjectId(input.reviewRefId);
		return await this.reviewService.createReview(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => Review)
	public async updateReview(
		@Args('input') input: ReviewUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Review> {
		console.log('Mutation: updateReview');
		input._id = shapeIntoMongoObjectId(input._id);
		input.reviewRefId = shapeIntoMongoObjectId(input.reviewRefId);
		return await this.reviewService.updateReview(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Reviews)
	public async getReviews(
		@Args('input') input: ReviewInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reviews> {
		console.log('Query: getReviews');
		input.search.reviewRefId = shapeIntoMongoObjectId(input.search.reviewRefId);
		const result = await this.reviewService.getReviews(memberId, input);
		return result;
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Reviews)
	public async getAllReviews(
		@Args('input') input: AllReviewInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reviews> {
		console.log('Query: getAllReviews');
		return await this.reviewService.getAllReviews(memberId, input);
	}

	// Admin
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Review)
	public async removeReviewByAdmin(@Args('reviewId') input: string): Promise<Review> {
		console.log('Mutation: removeReviewByAdmin');
		const reviewId = shapeIntoMongoObjectId(input);
		return await this.reviewService.removeReviewByAdmin(reviewId);
	}
}
