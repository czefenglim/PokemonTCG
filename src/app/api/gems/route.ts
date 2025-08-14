import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const COLORS = [
  'from-blue-400 to-purple-500',
  'from-pink-500 to-yellow-500',
  'from-green-400 to-teal-500',
];
const GLOWS = [
  'shadow-blue-500/40',
  'shadow-pink-500/40',
  'shadow-green-500/40',
];

export async function GET() {
  try {
    const gemPackages = await prisma.gemPackage.findMany({
      where: { active: true },
      orderBy: { amount: 'asc' },
    });

    // Transform to match frontend shape
    const transformed = gemPackages.map((pkg, i) => ({
      id: pkg.id,
      stripeId: pkg.stripeId,
      amount: pkg.amount,
      price: `$${(pkg.priceCents / 100).toFixed(2)}`,
      badge: pkg.badge || '',
      popular: pkg.popular,
      color: COLORS[i % COLORS.length],
      glow: GLOWS[i % GLOWS.length],
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('[API/GEMS] Failed to fetch gem packages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
