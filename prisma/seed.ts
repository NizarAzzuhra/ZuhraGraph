import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const buyerPassword = await bcrypt.hash('buyer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zuhra.com' },
    update: {},
    create: {
      name: 'Zuhra Admin',
      email: 'admin@zuhra.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      name: 'John Buyer',
      email: 'buyer@example.com',
      passwordHash: buyerPassword,
      role: 'BUYER',
    },
  });

  const queue = await prisma.queue.create({
    data: {
      currentSlot: 0,
      maxSlot: 10,
    }
  });

  const pkg = await prisma.package.create({
    data: {
      name: 'Standard Commission',
      description: 'Half body character illustration',
      price: 500000,
      slot: 1,
    }
  });

  console.log({ admin, buyer, queue, pkg });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
