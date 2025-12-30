import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { TransferBalanceDto } from './dto/transfer-balance.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Transfer')
@ApiBearerAuth()
@Controller('transfer')
export class TransferController {
  private readonly logger = new Logger(TransferController.name);

  constructor(private readonly transferService: TransferService) {
    this.logger.log('TransferController initialized');
  }

  @Post('send')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Transfer balance to another user' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient funds',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ type: TransferBalanceDto })
  async transferMoney(
    @CurrentUser('userId') fromUserId: string,
    @Body() dto: TransferBalanceDto,
  ) {
    this.logger.log(`POST /transfer/send from ${fromUserId}`);

    const result = await this.transferService.transferBalance(fromUserId, dto);

    this.logger.log(`POST /transfer/send complete from ${fromUserId}`);
    return result;
  }
}
