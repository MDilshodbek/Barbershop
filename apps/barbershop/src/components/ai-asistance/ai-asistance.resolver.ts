import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AiAssistantService } from './ai-asistance.service';
import { AskShopAssistantInput, AskShopAssistantOutput } from '../../libs/dto/ai-asistance/ai-asistance';

@Resolver()
export class AiAssistantResolver {
	constructor(private readonly aiAssistantService: AiAssistantService) {}

	@Mutation(() => AskShopAssistantOutput)
	async askShopAssistant(
		@Args('input') input: AskShopAssistantInput, // ✅ Comment: use Input DTO here
	): Promise<AskShopAssistantOutput> {
		console.log('OPENAI_API_KEY loaded:', !!process.env.OPENAI_API_KEY);
		console.log('OPENAI_API_KEY prefix:', process.env.OPENAI_API_KEY?.slice(0, 3));

		return this.aiAssistantService.answer(input.message);
	}
}
