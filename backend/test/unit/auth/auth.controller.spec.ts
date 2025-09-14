import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { LocalAuthGuard } from '../../../src/common/guards/auth.guard';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
  };

  const mockAuthResult = {
    access_token: 'jwt-token',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user', async () => {
      authService.register.mockResolvedValue(mockAuthResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const request = { user: mockUser };

    it('should login user', async () => {
      authService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.Login(request as any);

      expect(result).toEqual(mockAuthResult);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    const request = { user: mockUser };

    it('should return user profile', () => {
      const result = controller.getProfile(request as any);

      expect(result).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    const request = { user: mockUser };

    it('should return new access token', async () => {
      const refreshResult = { access_token: 'new-jwt-token' };
      authService.refreshToken.mockResolvedValue(refreshResult);

      const result = await controller.refreshToken(request as any);

      expect(result).toEqual(refreshResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser.id);
    });
  });
});