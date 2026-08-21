import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { PackageService } from '../../application/services/PackageService';
import { PrismaPackageRepository } from '../../infrastructure/repositories/PrismaPackageRepository';

const packageRepository = new PrismaPackageRepository();
const packageService = new PackageService(packageRepository);

const packageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  slot: z.number().int().min(1, "Slot must be at least 1")
});

export class PackageController {
  
  static async getAllPackages(req: Request) {
    try {
      const packages = await packageService.getAllPackages();
      return NextResponse.json({ success: true, data: packages }, { status: 200 });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }

  static async getPackageById(req: Request, id: string) {
    try {
      const pkg = await packageService.getPackageById(id);
      if (!pkg) {
        return NextResponse.json({ success: false, message: 'Package not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: pkg }, { status: 200 });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }

  static async createPackage(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }

      if ((session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }

      const body = await req.json();
      const validationResult = packageSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid request data', 
          errors: validationResult.error.issues 
        }, { status: 400 });
      }

      const { name, description, price, status, slot } = validationResult.data;
      const newPackage = await packageService.createPackage(name, description || null, price, status, slot);
      
      return NextResponse.json({ success: true, data: newPackage }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }

  static async updatePackage(req: Request, id: string) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }

      if ((session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }

      const body = await req.json();
      const validationResult = packageSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid request data', 
          errors: validationResult.error.issues 
        }, { status: 400 });
      }

      const { name, description, price, status, slot } = validationResult.data;
      const updatedPackage = await packageService.updatePackage(id, name, description || null, price, status, slot);
      
      return NextResponse.json({ success: true, data: updatedPackage }, { status: 200 });
    } catch (error: any) {
      if (error.message === 'Package not found') {
        return NextResponse.json({ success: false, message: error.message }, { status: 404 });
      }
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }

  static async deletePackage(req: Request, id: string) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }

      if ((session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }

      await packageService.deletePackage(id);
      
      return NextResponse.json({ success: true, message: 'Package deleted successfully' }, { status: 200 });
    } catch (error: any) {
      if (error.message === 'Package not found') {
        return NextResponse.json({ success: false, message: error.message }, { status: 404 });
      }
      return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }
}
