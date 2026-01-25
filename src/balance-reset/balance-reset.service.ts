import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BalanceResetService {
  private readonly logger = new Logger(BalanceResetService.name);

  constructor(@InjectQueue('balance-reset') private balanceResetQueue: Queue) {
    this.logger.log('BalanceResetService initialized');
  }

  async scheduleBalanceReset() {
    this.logger.log('Scheduling balance reset job...');

    const job = await this.balanceResetQueue.add('reset-all-balances', {
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Job created:`, {
      jobId: job.id,
    });

    return {
      jobId: job.id,
      status: 'queued',
    };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleScheduledReset() {
    this.logger.log('[CRON] Auto balance reset triggered');
    await this.scheduleBalanceReset();
  }
}
