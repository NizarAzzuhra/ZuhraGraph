import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Cloudinary server configuration is incomplete. Missing required environment variable: ${name}`);
  }
  return value;
}

const cloud_name = getRequiredEnv('CLOUDINARY_CLOUD_NAME');
const api_key = getRequiredEnv('CLOUDINARY_API_KEY');
const api_secret = getRequiredEnv('CLOUDINARY_API_SECRET');

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export default cloudinary;
