import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Package } from '../../domain/entities/Package';
import { PackageRepository } from '../../domain/interfaces/PackageRepository';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export class PrismaPackageRepository implements PackageRepository {
  public async findById(id: string): Promise<Package | null> {
    const data = await prisma.package.findFirst({
      where: { 
        id,
        deletedAt: null 
      },
    });

    if (!data) {
      return null;
    }

    return new Package(
      data.id,
      data.name,
      data.description,
      data.price.toNumber(), // Convert Decimal to number
      data.status as 'ACTIVE' | 'INACTIVE',
      data.slot
    );
  }

  public async findAll(): Promise<Package[]> {
    const data = await prisma.package.findMany({
      where: {
        deletedAt: null
      }
    });

    return data.map(d => new Package(
      d.id,
      d.name,
      d.description,
      d.price.toNumber(),
      d.status as 'ACTIVE' | 'INACTIVE',
      d.slot
    ));
  }

  public async save(pkg: Package): Promise<void> {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price, // Prisma accepts number for Decimal field
        status: pkg.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        slot: pkg.slot
      },
      create: {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        status: pkg.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        slot: pkg.slot
      }
    });
  }

  public async delete(id: string): Promise<void> {
    await prisma.package.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  public async search(keyword: string): Promise<Package[]> {
    const data = await prisma.package.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } }
        ]
      }
    });

    return data.map(d => new Package(
      d.id,
      d.name,
      d.description,
      d.price.toNumber(),
      d.status as 'ACTIVE' | 'INACTIVE',
      d.slot
    ));
  }
}
