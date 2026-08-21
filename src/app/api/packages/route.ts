import { NextResponse } from 'next/server';
import { PackageController } from '../../../presentation/controllers/PackageController';

export async function GET(req: Request) {
  return PackageController.getAllPackages(req);
}

export async function POST(req: Request) {
  return PackageController.createPackage(req);
}
