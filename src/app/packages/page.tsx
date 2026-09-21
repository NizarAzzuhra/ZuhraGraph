import React from 'react';
import { PackageService } from "../../application/services/PackageService";
import { PrismaPackageRepository } from "../../infrastructure/repositories/PrismaPackageRepository";
import PackagesClient from './PackagesClient';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const packageRepository = new PrismaPackageRepository();
  const packageService = new PackageService(packageRepository);
  
  // Get packages with calculated availability
  const activePackages = await packageService.getPackagesWithAvailability();

  return <PackagesClient initialPackages={activePackages} />;
}

