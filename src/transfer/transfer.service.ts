import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TransferBalanceDto } from './dto/transfer-balance.dto';
import { UserService } from '../profile/user/user.service';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    private readonly userService: UserService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    this.logger.log('TransferService initialized');
  }

  async transferBalance(fromUserId: string, dto: TransferBalanceDto) {
    const startTime = Date.now();

    this.logger.log(
      `Starting transfer: ${fromUserId} -> ${dto.toUserLogin}, amount: ${dto.amount}`,
    );

    this.logger.debug(`Transfer details:`, {
      fromUserId,
      toUserLogin: dto.toUserLogin,
      amount: dto.amount,
    });

    return await this.entityManager.transaction(async (manager) => {
      const fromUser = await this.userService.findUserWithBalance(
        fromUserId,
        manager,
      );
      if (!fromUser) {
        this.logger.error(`Sender not found: ${fromUserId}`);
        throw new NotFoundException('Sender not found');
      }
      this.logger.debug(
        `Sender found: ${fromUser.login} (balance: ${fromUser.balance})`,
      );

      const toUser = await this.userService.findUserByExactLogin(
        dto.toUserLogin,
        manager,
      );
      if (!toUser) {
        this.logger.error(`Recipient not found: ${dto.toUserLogin}`);
        throw new NotFoundException('Recipient not found');
      }
      this.logger.debug(
        `Recipient found: ${toUser.login} (balance: ${toUser.balance})`,
      );

      if (fromUser.id === toUser.id) {
        this.logger.warn(
          `User tried to transfer to themselves: ${fromUser.login}`,
        );
        throw new BadRequestException('Cannot transfer money to yourself');
      }

      if (dto.amount <= 0) {
        this.logger.warn(`Invalid amount: ${dto.amount} (must be > 0)`);
        throw new BadRequestException('Amount must be greater than 0');
      }

      if (Number(fromUser.balance) < dto.amount) {
        this.logger.warn(
          `Insufficient funds: ${fromUser.login} has ${fromUser.balance}, top up the balance - ${dto.amount}`,
        );
        throw new BadRequestException('Insufficient funds');
      }

      const newFromBalance = Number(
        (Number(fromUser.balance) - dto.amount).toFixed(2),
      );
      const newToBalance = Number(
        (Number(toUser.balance) + dto.amount).toFixed(2),
      );

      this.logger.log(`Updating balances...`);
      await this.userService.updateBalance(
        fromUser.id,
        newFromBalance,
        manager,
      );

      await this.userService.updateBalance(toUser.id, newToBalance, manager);

      const duration = Date.now() - startTime;
      this.logger.log(`Transfer completed successfully in ${duration}ms`);

      this.logger.debug(`Transfer result:`, {
        from: {
          id: fromUser.id,
          login: fromUser.login,
          oldBalance: fromUser.balance,
          newBalance: newFromBalance,
          change: -dto.amount,
        },
        to: {
          id: toUser.id,
          login: toUser.login,
          oldBalance: toUser.balance,
          newBalance: newToBalance,
          change: +dto.amount,
        },
        amount: dto.amount,
        duration: duration,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        fromUser: {
          id: fromUser.id,
          login: fromUser.login,
          newBalance: newFromBalance,
        },
        toUser: {
          id: toUser.id,
          login: dto.toUserLogin,
          newBalance: newToBalance,
        },
        amountSend: dto.amount,
      };
    });
  }
}
