import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CloudinaryStorageService } from '../../../infrastructure/storage/CloudinaryStorageService';

const storageService = new CloudinaryStorageService();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary temp folder, keyed by user email or ID to keep it somewhat organized
    const folder = `temp_uploads/${session.user.email?.split('@')[0] || 'guest'}`;
    const result = await storageService.uploadImage(buffer, folder);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    
    // Cek jika error berasal dari konfigurasi Cloudinary yang missing/invalid (http_code 401 / unknown API key)
    if (error && (error.http_code === 401 || String(error.message).includes('API key'))) {
      console.error('Server Configuration Error: Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET');
      return NextResponse.json({ 
        success: false, 
        message: 'Konfigurasi server tidak lengkap. Fitur unggah tidak dapat digunakan. Silakan hubungi administrator.' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: 'Gagal mengunggah gambar. Silakan coba lagi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ success: false, message: 'Missing publicId' }, { status: 400 });
    }

    // Attempt to delete from Cloudinary
    await storageService.deleteImage(publicId);

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    console.error('Delete Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete file' }, { status: 500 });
  }
}
