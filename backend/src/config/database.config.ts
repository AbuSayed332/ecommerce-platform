import { registerAs } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export interface DatabaseConfig {
  uri: string;
  name: string;
  options: MongooseModuleOptions;
}

export const databaseConfig = registerAs('database', (): DatabaseConfig => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  return {
      uri,
    name: process.env.DATABASE_NAME || 'ecommerce',
    options: {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '1'),
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME || '30000'),
      bufferCommands: false,
      retryWrites: true,
      retryReads: true,
      readPreference: 'primary',
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 5000,
      },
      // Enable logging in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: true,
      }),
    },
  };
});

// Database connection helper
export const getDatabaseConfig = (): MongooseModuleOptions => {
  const config = databaseConfig();
  return {
    uri: config.uri,
    ...config.options,
  };
};