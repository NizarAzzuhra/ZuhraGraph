const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgres://ae6af36efd9e946f2d5d42de8b84013a0895160717719579a499aefcc21796d6:sk_HNph-280_3OasKu7SjauY@pooled.db.prisma.io:5432/postgres?sslmode=require'
  });

  await client.connect();

  const orderId = 'ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7';
  
  const orderRes = await client.query('SELECT id, status FROM "orders" WHERE id = $1', [orderId]);
  console.log('--- ORDER ---');
  if (orderRes.rows.length > 0) {
    console.log(`ID: ${orderRes.rows[0].id}`);
    console.log(`Status: ${orderRes.rows[0].status}`);
  }

  const paymentRes = await client.query('SELECT * FROM "payments" WHERE "order_id" = $1 ORDER BY "created_at" DESC', [orderId]);
  
  console.log('\n--- PAYMENTS ---');
  for (const p of paymentRes.rows) {
    console.log(`ID: ${p.id}`);
    console.log(`Status: ${p.status}`);
    console.log(`Token: ${p.token ? p.token.substring(0, 8) + '...' : 'null'}`);
    console.log(`CreatedAt: ${p.created_at}`);
    console.log(`UpdatedAt: ${p.updated_at}`);
    console.log(`TransactionId: ${p.transaction_id}`);
    console.log('----------------');
  }

  await client.end();
}

main().catch(console.error);
