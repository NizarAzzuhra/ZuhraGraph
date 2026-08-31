const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const id = '8b664be3-b809-47d5-bc1d-3f9e2e794d43'; // Test Package E2E

  // Find all orders for this package
  const orders = await prisma.order.findMany({
    where: { packageId: id },
  });
  
  const orderIds = orders.map(o => o.id);

  if (orderIds.length > 0) {
    // Delete payments
    await prisma.payment.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    // Delete order_status_histories
    await prisma.orderStatusHistory.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    // Delete revision requests
    await prisma.revisionRequest.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    // Delete artwork versions
    await prisma.artworkVersion.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    // Delete discussions
    await prisma.activityDiscussion.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    // Delete brief edit requests
    await prisma.briefEditRequest.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    // Delete reviews
    await prisma.review.deleteMany({
      where: { orderId: { in: orderIds } },
    });

    // Finally delete orders
    await prisma.order.deleteMany({
      where: { packageId: id },
    });
    
    console.log(`Deleted ${orderIds.length} associated orders and all their dependencies.`);
  }

  // Now delete the package
  const deletedPkg = await prisma.package.delete({
    where: { id },
  });

  console.log(`Successfully deleted Test Package E2E (${deletedPkg.name})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
