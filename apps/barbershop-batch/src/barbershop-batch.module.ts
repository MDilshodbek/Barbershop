import { Module } from '@nestjs/common';
import { BarbershopBatchController } from './barbershop-batch.controller';
import { BarbershopBatchService } from './barbershop-batch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [BarbershopBatchController],
  providers: [BarbershopBatchService],
})
export class BarbershopBatchModule {}
