import React from 'react';
import { prisma } from '@/lib/prisma';
import PortfolioClient from './PortfolioClient';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const portfolios = await prisma.portfolio.findMany({
    where: { 
      status: 'ACTIVE', 
      deletedAt: null 
    },
    orderBy: { createdAt: 'desc' }
  });

  return <PortfolioClient initialPortfolios={portfolios} />;
}
