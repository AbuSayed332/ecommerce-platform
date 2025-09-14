import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/database/schemas/user.schema';
import { Product } from '../src/database/schemas/product.schema';
import { JwtService } from '@nestjs/jwt';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let jwtService: JwtService;
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    productRepository = moduleFixture.get<Repository<Product>>(getRepositoryToken(Product));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user and get auth token
    testUser = await userRepository.save({
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$10$hash', // hashed password
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
    });

    authToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
  });

  afterAll(async () => {
    // Clean up test data
    await productRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('/health/live (GET)', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200);
    });
  });

  describe('Authentication', () => {
    const registerDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    };

    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('/auth/register (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(loginDto.email);
        });
    });

    it('/auth/profile (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('/auth/profile (GET) - should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('/auth/refresh (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });
  });

  describe('Users', () => {
    it('/users (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('/users (GET) - should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toBeDefined();
        });
    });

    it('/users/:id (GET) - should return user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testUser.id);
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('/users/:id (PATCH) - should update user', () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe(updateDto.firstName);
          expect(res.body.lastName).toBe(updateDto.lastName);
        });
    });
  });

  describe('Products', () => {
    let createdProduct: any;

    const createProductDto = {
      name: 'Test Product',
      description: 'A test product',
      price: 99.99,
      category: 'Electronics',
      stock: 10,
      isActive: true,
    };

    it('/products (POST) - should create product with authentication', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createProductDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(createProductDto.name);
          expect(res.body.price).toBe(createProductDto.price);
          createdProduct = res.body;
        });
    });

    it('/products (GET) - should return paginated products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toBeDefined();
        });
    });

    it('/products/:id (GET) - should return product by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProduct.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdProduct.id);
          expect(res.body.name).toBe(createProductDto.name);
        });
    });

    it('/products/:id (PATCH) - should update product with authentication', () => {
      const updateDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      return request(app.getHttpServer())
        .patch(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateDto.name);
          expect(res.body.price).toBe(updateDto.price);
        });
    });

    it('/products/:id (DELETE) - should delete product with authentication', () => {
      return request(app.getHttpServer())
        .delete(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Validation', () => {
    it('should validate required fields on user registration', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeInstanceOf(Array);
        });
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          username: 'test',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });
});
