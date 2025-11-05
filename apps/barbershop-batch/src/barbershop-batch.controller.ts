import { Controller, Get, Logger } from '@nestjs/common';
import { BarbershopBatchService } from './barbershop-batch.service';
import { Cron, Timeout } from '@nestjs/schedule';
import { BATCH_LOYAL_USERS, BATCH_ROLLBACK, BATCH_TOP_BARBERS } from './lib/config';

@Controller()
export class BarbershopBatchController {
	constructor(private readonly barbershopBatchService: BarbershopBatchService) {}

	private logger: Logger = new Logger('BarbershopBatchController');

	@Timeout(1000)
	handleTimeout() {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 00 01 * * *', { name: BATCH_ROLLBACK })
	public async batchRollback() {
		try {
			this.logger['context'] = BATCH_ROLLBACK;
			this.logger.debug('EXECUTED!');
			await this.barbershopBatchService.batchRollback();
		} catch (error) {
			this.logger.error(error);
		}
	}

	@Cron('20 00 01 * * *', { name: BATCH_TOP_BARBERS })
	public async batchBarbers() {
		try {
			this.logger['context'] = BATCH_TOP_BARBERS;
			this.logger.debug('EXECUTED!');
			await this.barbershopBatchService.batchBarbers();
		} catch (error) {
			this.logger.error(error);
		}
	}

	@Cron('40 00 01 * * *', { name: BATCH_LOYAL_USERS })
	public async batchUsers() {
		try {
			this.logger['context'] = BATCH_LOYAL_USERS;
			this.logger.debug('EXECUTED!');
			await this.barbershopBatchService.batchUsers();
		} catch (error) {
			this.logger.error(error);
		}
	}

	@Get()
	getHello(): string {
		return this.barbershopBatchService.getHello();
	}
}
