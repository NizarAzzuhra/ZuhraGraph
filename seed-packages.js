require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const packages = await prisma.package.findMany();
  if (packages.length > 0) {
    await prisma.package.update({
      where: { id: packages[0].id },
      data: {
        name: 'GFX Anime Design',
        price: 150000, 
        description: 'Stylized, high-impact anime graphics perfect for branding, personal avatars, or editorial illustration. Character-focused with dynamic compositions.',
      }
    });
    
    if (packages.length > 1) {
      await prisma.package.update({
        where: { id: packages[1].id },
        data: {
          name: 'GFX C4D Design',
          price: 250000,
          description: 'Immersive 3D typography and abstract environments. Ideal for album covers, stream overlays, or striking promotional material.'
        }
      });
    } else {
      await prisma.package.create({
        data: {
          name: 'GFX C4D Design',
          price: 250000,
          description: 'Immersive 3D typography and abstract environments. Ideal for album covers, stream overlays, or striking promotional material.',
          status: 'ACTIVE',
          slot: 5
        }
      });
    }
  } else {
    await prisma.package.create({
      data: {
        name: 'GFX Anime Design',
        price: 150000,
        description: 'Stylized, high-impact anime graphics perfect for branding, personal avatars, or editorial illustration. Character-focused with dynamic compositions.',
        status: 'ACTIVE',
        slot: 5
      }
    });
    await prisma.package.create({
      data: {
        name: 'GFX C4D Design',
        price: 250000,
        description: 'Immersive 3D typography and abstract environments. Ideal for album covers, stream overlays, or striking promotional material.',
        status: 'ACTIVE',
        slot: 5
      }
    });
  }
  console.log('Packages updated successfully');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
