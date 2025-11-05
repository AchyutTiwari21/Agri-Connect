import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json(reviews);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


