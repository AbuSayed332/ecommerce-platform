import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password', mockUser.password);
    });

    it('should return null when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user is not active', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      usersService.findByEmail.mockResolvedValue(inactiveUser as any);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email };
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(mockUser as any);

      expect(result).toEqual({
        access_token: 'jwt-token',
        user: mockUser,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    // it('should successfully register a new user', async () => {
    //   usersService.findByEmail.mockResolvedValue(null);
    //   usersService.findByUsername.mockResolvedValue(null);
    //   mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
    //   usersService.create.mockResolvedValue({ ...mockUser, ...registerDto } as any);
    //   jwtService.sign.mockReturnValue('jwt-token');

    //   const result = await service.register(registerDto);

    //   expect(result).toHaveProperty('access_token');
    //   expect(result).toHaveProperty('user');
    //   expect(usersService.create).toHaveBeenCalledWith({
    //     ...registerDto,
    //     password: 'hashedpassword',
    //   });
    // });

    it('should throw BadRequestException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
    });

    // it('should throw BadRequestException if username already exists', async () => {
    //   usersService.findByEmail.mockResolvedValue(null);
    //   usersService.findByUsername.mockResolvedValue(mockUser as any);

    //   await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    //   expect(usersService.findByUsername).toHaveBeenCalledWith(registerDto.username);
    // });
  });

  describe('refreshToken', () => {
    // it('should return new access token', async () => {
    //   usersService.findOne.mockResolvedValue(mockUser as any);
    //   jwtService.sign.mockReturnValue('new-jwt-token');

    //   const result = await service.refreshToken(mockUser.id);

    //   expect(result).toEqual({
    //     access_token: 'new-jwt-token',
    //   });
    //   expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
    // });

    // it('should throw UnauthorizedException if user not found', async () => {
    //   usersService.findOne.mockResolvedValue(null);

    //   await expect(service.refreshToken('invalid-id')).rejects.toThrow(UnauthorizedException);
    // });
  });
});