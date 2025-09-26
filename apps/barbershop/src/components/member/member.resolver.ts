import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException, UseGuards } from '@nestjs/common';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		console.log('Mutation: signup');
		return await this.memberService.signup(input);
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		console.log('Mutation: login');
		return await this.memberService.login(input);
	}
	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public async updateMember(): Promise<string> {
		console.log('Mutation: updateMember');
		return this.memberService.updateMember();
	}

	
	// Test
	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
		console.log('Query: checkAuth');
		return `Hi ${memberNick}`;
	}

	// Test Roles
	@Roles(MemberType.USER, MemberType.BARBER)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		console.log('Query: checkAuth');
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType}, your phone number is ${authMember.memberPhone} and your id is ${authMember._id}`;
	}

	// @Query(() => Member)
	// public async getMember(): Promise<Member> {
	// 	console.log('Query: getMember');
	// 	return this.memberService.getMember();
	// }

	// // Authorization: Admin
	// @Roles(MemberType.ADMIN)
	// @UseGuards(RolesGuard)
	// @Query(() => Members)
	// public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
	// 	console.log('Query: getAllMembersByAdmin');
	// 	return await this.memberService.getAllMembersByAdmin(input);
	// }

	// // Authorizzation: Admin
	// @Roles(MemberType.ADMIN)
	// @UseGuards(RolesGuard)
	// @Mutation(() => Member)
	// public async updateMemberByAdmin(@Args('input') input: MemberUpdate): Promise<Member> {
	// 	console.log('Mutation: updateMemberByAdmin');
	// 	return await this.memberService.updateMemberByAdmin(input);
	// }
}
