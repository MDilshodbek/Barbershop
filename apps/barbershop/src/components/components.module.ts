import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [MemberModule, ServicesModule]
})
export class ComponentsModule {}
