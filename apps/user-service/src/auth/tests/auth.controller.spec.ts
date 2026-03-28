import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const registerDto = {
  login: 'makaka228',
  email: 'makaka228@gmail.com',
  password: 'makakamakaka3939',
  age: 30,
  description: 'makakamakaka3939',
};

const loginDto = {
  identifier: 'makaka228',
  password: 'makakamakaka3939',
};

const tokens = {
  access_token: 'access-token-mock',
  refresh_token: 'refresh-token-mock',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn().mockResolvedValue(tokens),
      login: jest.fn().mockResolvedValue(tokens),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should return tokens and call authService.register with dto', async () => {
      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(tokens);
    });
  });

  describe('login', () => {
    it('should return tokens and call authService.login with dto', async () => {
      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(tokens);
    });
  });
});
