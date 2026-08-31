import { prisma } from './src/lib/prisma.ts';
import * as bcrypt from 'bcrypt';

async function main() {
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'testbuyer@zuhragraph.local' },
    update: {
      passwordHash: buyerPassword,
    },
    create: {
      name: 'Test Buyer',
      email: 'testbuyer@zuhragraph.local',
      passwordHash: buyerPassword,
      role: 'BUYER',
    }
  });

  console.log('User testbuyer@zuhragraph.local password reset to: buyer123');
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
