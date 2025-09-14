import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../../../src/modules/products/products.controller';
import { ProductsService } from '../../../src/modules/products/products.service';
import { CreateProductDto } from '../../../src/modules/products/dto/create-product.dto';
import { UpdateProductDto } from '../../../src/modules/products/dto/update-product.dto';
import { ObjectId } from 'bson';

describe('ProductController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the create method of the ProductService', async () => {
      const createProductDto: CreateProductDto = {
          name: 'Test Product',
          description: 'Test Description',
          price: 10,
          stock: 0,
          category: new ObjectId
      };
      await controller.create(createProductDto);
      expect(service.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('findAll', () => {
    it('should call the findAll method of the ProductService', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call the findOne method of the ProductService with the given id', async () => {
      const id = '1';
      await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(+id);
    });
  });

  describe('update', () => {
    it('should call the update method of the ProductService with the given id and updateProductDto', async () => {
      const id = '1';
      const updateProductDto: UpdateProductDto = {
          name: 'Updated Product',
          slug: ''
      };
      await controller.update(id, updateProductDto);
      expect(service.update).toHaveBeenCalledWith(+id, updateProductDto);
    });
  });

  describe('remove', () => {
    it('should call the remove method of the ProductService with the given id', async () => {
      const id = '1';
      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(+id);
    });
  });
});