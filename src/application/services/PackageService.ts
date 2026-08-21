import { Package } from '../../domain/entities/Package';
import { PackageRepository } from '../../domain/interfaces/PackageRepository';
import { v4 as uuidv4 } from 'uuid';

export class PackageService {
  constructor(private readonly packageRepository: PackageRepository) {}

  public async createPackage(
    name: string,
    description: string | null,
    price: number,
    status: 'ACTIVE' | 'INACTIVE',
    slot: number
  ): Promise<Package> {
    const pkg = new Package(uuidv4(), name, description, price, status, slot);
    await this.packageRepository.save(pkg);
    return pkg;
  }

  public async getPackageById(id: string): Promise<Package | null> {
    return this.packageRepository.findById(id);
  }

  public async getAllPackages(): Promise<Package[]> {
    return this.packageRepository.findAll();
  }

  public async updatePackage(
    id: string,
    name: string,
    description: string | null,
    price: number,
    status: 'ACTIVE' | 'INACTIVE',
    slot: number
  ): Promise<Package> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new Error('Package not found');
    }
    
    // Create updated instance according to the entity schema. Validations will run in the constructor.
    const updatedPkg = new Package(pkg.id, name, description, price, status, slot);
    
    await this.packageRepository.save(updatedPkg);
    return updatedPkg;
  }

  public async deletePackage(id: string): Promise<void> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new Error('Package not found');
    }
    
    await this.packageRepository.delete(id);
  }

  public async searchPackages(keyword: string): Promise<Package[]> {
    return this.packageRepository.search(keyword);
  }
}
