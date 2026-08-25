import { StorageService, UploadResult } from '../../domain/interfaces/StorageService';
import cloudinary from '../../config/cloudinary';

export class CloudinaryStorageService implements StorageService {
  constructor() {}

  public async uploadImage(fileBuffer: Buffer, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `zuhragraph/${folder}` },
        (error, result) => {
          if (error) return reject(error);
          if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );
      
      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  public async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary deleteImage error:', error);
      throw new Error('Failed to delete image from Cloudinary.');
    }
  }
}
