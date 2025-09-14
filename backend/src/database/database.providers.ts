import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

// export const databaseProviders = {
//   provide: 'DATABASE_CONNECTION',
//   useFactory: async (configService: ConfigService): Promise<MongooseModuleOptions> => ({
//     uri: configService.get<string>('MONGODB_URI'),
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     autoIndex: true,
//     serverSelectionTimeoutMS: 5000,
//     socketTimeoutMS: 45000,
//     bufferCommands: false,
//     bufferMaxEntries: 0,
//   }),
//   inject: [ConfigService],
// };
export const databaseProviders = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async (configService: ConfigService): Promise<MongooseModuleOptions> => ({
    uri: configService.get<string>('MONGODB_URI'),
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
  }),
  inject: [ConfigService],
};