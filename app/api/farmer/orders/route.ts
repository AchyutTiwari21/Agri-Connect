import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productIdsParam = searchParams.get('productIds');
    const productIds = productIdsParam ? productIdsParam.split(',') : [];

    const orders = await prisma.order.findMany({
      where: productIds.length ? { productId: { in: productIds } } : undefined,
      include: { product: true },
    });
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


