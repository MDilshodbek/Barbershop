import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IceModule } from './ice/ice.module';

@Module({
  imports: [IceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
