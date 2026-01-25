import { Module } from '@nestjs/common';
import { BarbershopBatchController } from './barbershop-batch.controller';
import { BarbershopBatchService } from './barbershop-batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from 'apps/barbershop/src/schemas/Member.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
	],
	controllers: [BarbershopBatchController],
	providers: [BarbershopBatchService],
})
export class BarbershopBatchModule {}

