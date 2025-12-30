import { BalanceResetService } from './balance-reset.service';
import { Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Balance Reset')
@Controller('balance-reset')
export class BalanceResetController {
  private readonly logger = new Logger(BalanceResetController.name);

  constructor(private readonly balanceResetService: BalanceResetService) {
    this.logger.log('BalanceResetController initialized');
  }

  @Post()
  @ApiOperation({ summary: 'Trigger balance reset for all users' })
  @ApiResponse({
    status: 200,
    description: 'Balance reset job has been queued',
    schema: {
      example: {
        message: 'Balance reset job has been queued',
        jobId: '12345',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async triggerBalanceReset() {
    this.logger.log('POST /balance-reset');

    const jobInfo = await this.balanceResetService.scheduleBalanceReset();

    this.logger.debug(`Job queued:`, {
      jobId: jobInfo.jobId,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Balance reset job has been queued',
      jobId: jobInfo.jobId,
      timestamp: new Date().toISOString(),
    };
  }
}
