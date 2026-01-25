import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/barbershop/src/libs/dto/member/member';
import { MemberStatus, MemberType } from 'apps/barbershop/src/libs/enums/member.enum';
import { Model } from 'mongoose';

@Injectable()
export class BarbershopBatchService {
	constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

	public async batchRollback(): Promise<void> {
		console.log('batchRollback');
	}

	public async batchBarbers(): Promise<void> {
		const barbers: Member[] = await this.memberModel
			.find({
				memberType: MemberType.BARBER,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = barbers.map(async (ele: Member) => {
			const { _id, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchUsers(): Promise<void> {
		const barbers: Member[] = await this.memberModel
			.find({
				memberType: MemberType.USER,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = barbers.map(async (ele: Member) => {
			const { _id, memberPoints, memberViews } = ele;
			const rank = memberPoints * 3 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Wellcome to Barbershop Batch server!';
	}
}
