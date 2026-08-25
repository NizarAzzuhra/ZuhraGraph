import { CloudinaryStorageService } from './src/infrastructure/storage/CloudinaryStorageService';

async function test() {
  const service = new CloudinaryStorageService();
  try {
    console.log("Testing upload...");
    const res = await service.uploadImage(Buffer.from('hello'), 'test');
    console.log("Upload result:", res);
  } catch (err) {
    console.error("Upload failed with error:", err);
  }
}

test();
