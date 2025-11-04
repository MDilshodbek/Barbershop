import { Injectable } from '@nestjs/common';

@Injectable()
export class BarbershopBatchService {

  public async batchRollback (): Promise<void>{
    console.log('batchRollback');
    
  }

  public async batchBarbers (): Promise<void>{
    console.log('batchBarbers');
  }

  public async batchUsers (): Promise<void>{
    console.log('batchUsers');
  }

    public getHello(): string {
    return 'Wellcome to Barbershop Batch server!';
  }
}
