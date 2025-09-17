import { NestFactory } from '@nestjs/core';
import { BarbershopBatchModule } from './barbershop-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BarbershopBatchModule);
  await app.listen(process.env.PORT_BATCH ?? 3000);
}
bootstrap();
