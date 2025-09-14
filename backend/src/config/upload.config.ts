import { registerAs } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

export interface UploadConfig {
  destination: string;
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
  imageQuality: number;
  generateThumbnails: boolean;
  thumbnailSizes: Array<{ name: string; width: number; height: number }>;
  enableCloudinary: boolean;
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

export const uploadConfig = registerAs('upload', (): UploadConfig => {
  const destination = process.env.UPLOAD_DEST || './uploads';
  
  // Create upload directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const config: UploadConfig = {
    destination,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    allowedImageTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    allowedDocumentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ],
    imageQuality: parseInt(process.env.IMAGE_QUALITY || '85'),
    generateThumbnails: process.env.GENERATE_THUMBNAILS !== 'false',
    thumbnailSizes: [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 },
    ],
    enableCloudinary: process.env.CLOUDINARY_CLOUD_NAME ? true : false,
  };

  // Add Cloudinary config if available
  if (config.enableCloudinary) {
    config.cloudinary = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
    };
  }

  return config;
});

// Multer configuration for different file types
export const getMulterConfig = (uploadType: 'images' | 'documents' | 'all' = 'all'): MulterOptions => {
  const config = uploadConfig();
  
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(config.destination, uploadType);
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      let allowedTypes: string[] = [];
      
      switch (uploadType) {
        case 'images':
          allowedTypes = config.allowedImageTypes;
          break;
        case 'documents':
          allowedTypes = config.allowedDocumentTypes;
          break;
        default:
          allowedTypes = [...config.allowedImageTypes, ...config.allowedDocumentTypes];
      }
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    },
    limits: {
      fileSize: config.maxFileSize,
      files: parseInt(process.env.MAX_FILES_COUNT || '5'),
    },
  };
};

// File upload paths
export const UPLOAD_PATHS = {
  PRODUCTS: 'products',
  USERS: 'users',
  CATEGORIES: 'categories',
  TEMP: 'temp',
  DOCUMENTS: 'documents',
} as const;