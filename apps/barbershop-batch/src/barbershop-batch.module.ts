import { Module } from '@nestjs/common';
import { BarbershopBatchController } from './barbershop-batch.controller';
import { BarbershopBatchService } from './barbershop-batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, ScheduleModule.forRoot()],
  controllers: [BarbershopBatchController],
  providers: [BarbershopBatchService],
})
export class BarbershopBatchModule {}
