import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { View } from '../../libs/dto/view/view';
import { OrdinaryInquiry } from '../../libs/dto/member/member.input';
import { Members } from '../../libs/dto/member/member';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExustence(input);
		if (!viewExist) {
			console.log(' - New View Insert -');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExustence(input: ViewInput): Promise<View> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Members> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.MEMBER, memberId: memberId };

		const data: T = await this.viewModel.aggregate([
			{ $match: match },
			{ $sort: { updatedAt: -1 } },
			{
				$facet: {
					list: [
						{ $skip: (page - 1) * limit },
						{ $limit: limit },
						{
							$lookup: {
								from: 'members',
								localField: 'viewRefId',
								foreignField: '_id',
								as: 'visitedMembers',
							},
						},
						{ $unwind: '$visitedMembers' },
					],
					metaCounter: [{ $count: 'total' }],
				},
			},
		]);

		console.log('data:', data);
		const result: Members = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.visitedMembers);
		return result;
	}
}
