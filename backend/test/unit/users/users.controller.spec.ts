import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/modules/users/users.controller';
import { UsersService } from '../../../src/modules/users/users.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockUser],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a user', async () => {
      service.create.mockResolvedValue(mockUser as any);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const query = { page: 1, limit: 10 };
      service.findAll.mockResolvedValue(mockPaginatedResult as any);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      service.findOne.mockResolvedValue(mockUser as any);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    const updateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      service.update.mockResolvedValue(updatedUser as any);

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith('1', updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});