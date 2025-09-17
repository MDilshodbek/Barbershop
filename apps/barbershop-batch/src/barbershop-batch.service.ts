import { Injectable } from '@nestjs/common';

@Injectable()
export class BarbershopBatchService {
  getHello(): string {
    return 'Wellcome to Barbershop Batch server!';
  }
}
