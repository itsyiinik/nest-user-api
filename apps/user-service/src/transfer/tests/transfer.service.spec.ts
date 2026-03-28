import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransferService } from '../transfer.service';
import { UserService } from '../../user/user.service';
import { getEntityManagerToken } from '@nestjs/typeorm';

const mockFromUser = { id: 'user-1', login: 'alice', balance: 200 };
const mockToUser = { id: 'user-2', login: 'bob', balance: 50 };

describe('TransferService', () => {
  let service: TransferService;

  const mockUserService = {
    findUserWithBalance: jest.fn(),
    findUserByExactLogin: jest.fn(),
    updateBalance: jest.fn().mockResolvedValue(undefined),
  };

  const mockEntityManager: Record<string, jest.Mock> = {
    transaction: jest.fn((cb: (em: unknown) => unknown) =>
      cb(mockEntityManager),
    ),
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: UserService, useValue: mockUserService },
        { provide: getEntityManagerToken(), useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transferBalance', () => {
    it('should transfer funds and return new balances', async () => {
      mockUserService.findUserWithBalance.mockResolvedValue(mockFromUser);
      mockUserService.findUserByExactLogin.mockResolvedValue(mockToUser);

      const result = await service.transferBalance('user-1', {
        toUserLogin: 'bob',
        amount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.fromUser.newBalance).toBe(100);
      expect(result.toUser.newBalance).toBe(150);
      expect(mockUserService.updateBalance).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ eventType: 'transfer-completed' }),
      );
    });

    it('should throw NotFoundException when sender not found', async () => {
      mockUserService.findUserWithBalance.mockResolvedValue(null);

      await expect(
        service.transferBalance('nonexistent', {
          toUserLogin: 'bob',
          amount: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when recipient not found', async () => {
      mockUserService.findUserWithBalance.mockResolvedValue(mockFromUser);
      mockUserService.findUserByExactLogin.mockResolvedValue(null);

      await expect(
        service.transferBalance('user-1', {
          toUserLogin: 'nobody',
          amount: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transferring to yourself', async () => {
      const sameUser = { id: 'user-1', login: 'alice', balance: 200 };
      mockUserService.findUserWithBalance.mockResolvedValue(sameUser);
      mockUserService.findUserByExactLogin.mockResolvedValue(sameUser);

      await expect(
        service.transferBalance('user-1', { toUserLogin: 'alice', amount: 50 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when insufficient funds', async () => {
      mockUserService.findUserWithBalance.mockResolvedValue({
        ...mockFromUser,
        balance: 10,
      });
      mockUserService.findUserByExactLogin.mockResolvedValue(mockToUser);

      await expect(
        service.transferBalance('user-1', { toUserLogin: 'bob', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
