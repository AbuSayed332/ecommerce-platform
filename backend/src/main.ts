import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
 
// Winston Logger Configuration
const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
 
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Static Files
  // Serve files from the 'public' directory at the root (for swagger-ui-custom.css)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Security Middleware
  const cspDirectives = {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' for swagger customCss
    scriptSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  };

  if (environment !== 'production') {
    // Loosen CSP for Swagger UI in non-production environments
    cspDirectives.styleSrc.push('https://unpkg.com');
    cspDirectives.scriptSrc.push('https://unpkg.com');
  }

  app.use(helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression());

  // Cookie Parser
  app.use(cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints
            ? Object.values(error.constraints)[0]
            : 'Validation error',
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed. Please check your input.',
          errors: result,
        });
      },
    }),
  );

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger Documentation
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('A comprehensive e-commerce backend API built with NestJS')
      .setVersion('1.0')
      .addTag('Authentication', 'User authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Products', 'Product management endpoints')
      .addTag('Categories', 'Category management endpoints')
      .addTag('Orders', 'Order management endpoints')
      .addTag('Cart', 'Shopping cart endpoints')
      .addTag('Reviews', 'Product review endpoints')
      .addTag('Wishlist', 'Wishlist management endpoints')
      .addTag('Payments', 'Payment processing endpoints')
      .addTag('Coupons', 'Coupon and discount endpoints')
      .addTag('Analytics', 'Analytics and reporting endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer(`http://localhost:${port}`, 'Development server')
      .addServer(configService.get<string>('API_URL', 'https://api.example.com'), 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document, {
      customSiteTitle: 'E-commerce API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      customCssUrl: '/public/swagger-ui-custom.css',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });

    logger.log(`📚 API Documentation available at: http://localhost:${port}/api/v1/docs`, 'Bootstrap');
  }

  // Graceful Shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  // Start Server
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`🌍 Environment: ${environment}`, 'Bootstrap');
  logger.log(`📊 Health Check: http://localhost:${port}/api/v1/health`, 'Bootstrap');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error, 'Process');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'Process');
  process.exit(1);
});

bootstrap().catch(error => {
  logger.error('Application failed to start:', error, 'Bootstrap');
  process.exit(1);
});
