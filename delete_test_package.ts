import { prisma } from './src/lib/prisma.ts';

async function main() {
  // Find the package by name
  const pkg = await prisma.package.findFirst({
    where: {
      name: {
        contains: 'test e2e',
        mode: 'insensitive',
      },
    },
  });

  if (!pkg) {
    console.log('No package found matching "test e2e"');
    return;
  }

  // Check if it has orders
  const ordersCount = await prisma.order.count({
    where: { packageId: pkg.id },
  });

  if (ordersCount > 0) {
    console.log(`Cannot delete package "${pkg.name}" (${pkg.id}) because it has ${ordersCount} orders.`);
    return;
  }

  // Delete it
  await prisma.package.delete({
    where: { id: pkg.id },
  });

  console.log(`Successfully deleted package: "${pkg.name}" (${pkg.id})`);
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
