import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../../../src/modules/products/products.service';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<Product>>;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'A test product',
    price: 99.99,
    category: 'Electronics',
    stock: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto = {
      name: 'New Product',
      description: 'A new product',
      price: 149.99,
      category: 'Electronics',
      stock: 20,
      isActive: true,
    };

    it('should create a new product', async () => {
      repository.create.mockReturnValue(mockProduct as any);
      repository.save.mockResolvedValue(mockProduct as any);

      const result = await service.create(createProductDto, '1');

      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalledWith({
        ...createProductDto,
        createdBy: '1',
      });
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct];
      const total = 1;
      const queryBuilder = repository.createQueryBuilder();
      
      (queryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([products, total]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(products);
      expect(result.meta.total).toBe(total);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should apply filters correctly', async () => {
      const products = [mockProduct];
      const total = 1;
      const queryBuilder = repository.createQueryBuilder();
      
      (queryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([products, total]);

      await service.findAll({
        page: 1,
        limit: 10,
        category: 'Electronics',
        minPrice: 50,
        maxPrice: 200,
        search: 'test',
      });

      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      repository.findOne.mockResolvedValue(mockProduct as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateProductDto = {
      name: 'Updated Product',
      price: 199.99,
    };

    it('should update product', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.save.mockResolvedValue(updatedProduct as any);

      const result = await service.update('1', updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(repository.save).toHaveBeenCalledWith({ ...mockProduct, ...updateProductDto });
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateProductDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove product', async () => {
      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const products = [mockProduct];
      repository.find.mockResolvedValue(products as any[]);

      const result = await service.findByCategory('Electronics');

      expect(result).toEqual(products);
      expect(repository.find).toHaveBeenCalledWith({
        where: { category: 'Electronics', isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const updatedProduct = { ...mockProduct, stock: 15 };
      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.save.mockResolvedValue(updatedProduct as any);

      const result = await service.updateStock('1', 15);

      expect(result).toEqual(updatedProduct);
      expect(repository.save).toHaveBeenCalledWith({ ...mockProduct, stock: 15 });
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateStock('invalid-id', 15)).rejects.toThrow(NotFoundException);
    });
  });
});