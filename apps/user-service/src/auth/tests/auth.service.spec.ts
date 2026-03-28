import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';

const registerDto = {
  login: 'user1',
  email: 'user1@example.com',
  password: 'password123',
  age: 25,
  description: 'About me',
};

const loginDto = {
  identifier: 'user1',
  password: 'password123',
};

const mockUser = {
  id: 'user-id-1',
  login: 'user1',
  email: 'user1@example.com',
};

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  const mockUserService = {
    create: jest.fn(),
    validateCredentials: jest.fn(),
    updateRefreshToken: jest.fn().mockResolvedValue(undefined),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token'),
  };

  const mockConfigService = {
    get: jest.fn(
      (key: string) =>
        ({ JWT_ACCESS_EXPIRES: '1h', JWT_REFRESH_EXPIRES: '7d' })[key],
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create user, generate tokens and return them', async () => {
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(userService.create).toHaveBeenCalledWith({
        login: registerDto.login,
        email: registerDto.email,
        password: registerDto.password,
        age: registerDto.age,
        description: registerDto.description,
      });
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
      expect(result).toEqual({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    it('should propagate error when userService.create fails', async () => {
      const error = new Error('User already exists');
      mockUserService.create.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
      expect(userService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should validate credentials, generate tokens and return them', async () => {
      mockUserService.validateCredentials.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(userService.validateCredentials).toHaveBeenCalledWith(
        loginDto.identifier,
        loginDto.password,
      );
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
      expect(result).toEqual({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
    });

    it('should throw when credentials are invalid', async () => {
      mockUserService.validateCredentials.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });
});
