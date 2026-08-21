import { Package } from '../entities/Package';

export interface PackageRepository {
  findById(id: string): Promise<Package | null>;
  findAll(): Promise<Package[]>;
  save(pkg: Package): Promise<void>;
  delete(id: string): Promise<void>;
  search(keyword: string): Promise<Package[]>;
}
