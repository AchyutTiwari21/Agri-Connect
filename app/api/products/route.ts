import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId');

    const products = await prisma.product.findMany({
      where: farmerId ? { farmerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { reviews: { select: { rating: true } }, farmer: { select: { name: true } } },
    });
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
        price: Number(body.price),
        quantity: Number(body.quantity),
        category: body.category,
        farmerId: body.farmer_id,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await prisma.product.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
        price: Number(body.price),
        quantity: Number(body.quantity),
        category: body.category,
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


