import { NextResponse } from 'next/server';
import { PrismaOrderRepository } from '../../../infrastructure/repositories/PrismaOrderRepository';
export async function GET() {
  const repo = new PrismaOrderRepository();
  const order = await repo.findById('ebcc3a1a-a7d2-4ac9-bef2-a631fc8856e7');
  return NextResponse.json({ order, stringified: JSON.stringify(order) });
}
