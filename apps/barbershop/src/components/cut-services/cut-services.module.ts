import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../schemas/Service.model';
import { AuthModule } from '../auth/auth.module';
import { CutServicesService } from './cut-services.service';
import { CutServicesResolver } from './cut-services.resolver';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Services', schema: ServiceSchema }]), AuthModule],
	providers: [CutServicesResolver, CutServicesService],
	exports: [CutServicesService],
})
export class CutServicesModule {}
