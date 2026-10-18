import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';
import { AiModule } from '../components/ai/ai.module';

@Module({
	imports: [AuthModule, AiModule],
	providers: [SocketGateway],
})
export class SocketModule {}
