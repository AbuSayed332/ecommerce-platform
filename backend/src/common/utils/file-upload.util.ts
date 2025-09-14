import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import sharp from 'sharp';
import type { Multer } from 'multer';

const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  destination?: string;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
}

export interface UploadedFileInfo {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  url: string;
  thumbnailUrl?: string;
}

export class FileUploadUtil {
  private static readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private static readonly DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  /**
   * Validate uploaded file
  static validateFile(
    file: Multer.File,
    options: FileUploadOptions = {},
  ): void {
  ): void {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedMimeTypes = this.IMAGE_MIME_TYPES,
      allowedExtensions,
    } = options;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${this.formatFileSize(maxSize)}`,
      );
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension if specified
    if (allowedExtensions) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
        );
      }
    }
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Get file info from uploaded file
  static getFileInfo(
    file: Multer.File,
    baseUrl: string = '',
  ): UploadedFileInfo {
  ): UploadedFileInfo {
    const extension = path.extname(file.originalname);
    
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      extension,
      url: `${baseUrl}/${file.filename}`,
    };
  }

  /**
   * Create thumbnail for image
   */
  static async createThumbnail(
    filePath: string,
    thumbnailPath: string,
    size: { width: number; height: number } = { width: 300, height: 300 },
  ): Promise<void> {
    try {
      await sharp(filePath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (error) {
      throw new BadRequestException('Failed to create thumbnail');
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (await existsAsync(filePath)) {
        await unlinkAsync(filePath);
      }
    } catch (error) {
      // Log error but don't throw - file might not exist
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map(filePath => this.deleteFile(filePath)));
  }
}
