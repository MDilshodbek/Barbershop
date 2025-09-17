import { Controller, Get } from '@nestjs/common';
import { BarbershopBatchService } from './barbershop-batch.service';

@Controller()
export class BarbershopBatchController {
  constructor(private readonly barbershopBatchService: BarbershopBatchService) {}

  @Get()
  getHello(): string {
    return this.barbershopBatchService.getHello();
  }
}
