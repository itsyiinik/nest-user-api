import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Logger } from '@nestjs/common';

@Processor('balance-reset')
export class BalanceResetProcessor {
  private readonly logger = new Logger(BalanceResetProcessor.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    this.logger.log('BalanceResetProcessor initialized');
  }

  @Process('reset-all-balances')
  async handleBalanceReset(job: Job<{ timestamp: string }>) {
    this.logger.log(`Job ${job.id} started`);
    this.logger.debug(`Job data:`, job.data);

    try {
      const result = await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ balance: 0 })
        .where('"deletedAt" IS NULL AND balance != 0')
        .execute();

      this.logger.log(`Job ${job.id} done: ${result.affected} users updated`);

      return {
        updated: result.affected,
        jobId: job.id,
      };
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }
}
