import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import * as bcrypt from 'bcrypt';

async function main() {
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;
  if (!adminPasswordPlain) {
    throw new Error('ADMIN_PASSWORD environment variable is not defined. Please set ADMIN_PASSWORD before running seed.');
  }

  const adminPassword = await bcrypt.hash(adminPasswordPlain, 10);
  const buyerPasswordPlain = process.env.BUYER_PASSWORD || 'buyer123';
  const buyerPassword = await bcrypt.hash(buyerPasswordPlain, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zuhra.com' },
    update: {
      passwordHash: adminPassword,
    },
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

  const pkg = await prisma.package.create({
    data: {
      name: 'Standard Commission',
      description: 'Half body character illustration',
      price: 500000,
      slot: 1,
    }
  });

  console.log({ admin, buyer, pkg });
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
