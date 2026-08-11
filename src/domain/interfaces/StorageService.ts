export interface UploadResult {
  url: string;
  publicId: string;
}

export interface StorageService {
  uploadImage(fileBuffer: Buffer, folder: string): Promise<UploadResult>;
  deleteImage(publicId: string): Promise<void>;
}
