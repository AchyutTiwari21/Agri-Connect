import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, user_id, rating, comment } = body;
    if (!product_id || !user_id || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId: product_id,
        userId: user_id,
        rating: Number(rating),
        comment: comment ?? null,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate review' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


