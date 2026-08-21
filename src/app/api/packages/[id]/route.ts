import { NextResponse } from 'next/server';
import { PackageController } from '../../../../presentation/controllers/PackageController';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return PackageController.getPackageById(req, id);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return PackageController.updatePackage(req, id);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return PackageController.deletePackage(req, id);
}
