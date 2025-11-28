import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productIdsParam = searchParams.get('productIds');
    const productIds = productIdsParam
      ? productIdsParam.split(',').filter((id) => id.trim().length)
      : [];

    const orders = await prisma.order.findMany({
      where: productIds.length ? { productId: { in: productIds } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            image: true,
          },
        },
      },
    });

    const buyerIds = Array.from(new Set(orders.map((order) => order.buyerId).filter(Boolean)));
    const buyerProfiles = buyerIds.length
      ? await prisma.profile.findMany({
          where: { id: { in: buyerIds as string[] } },
          include: { user: { select: { email: true } } },
        })
      : [];
    const buyerMap = new Map(
      buyerProfiles.map((profile) => [
        profile.id,
        {
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          email: profile.user?.email ?? null,
        },
      ])
    );

    const mapped = orders.map((o) => ({
      id: o.id,
      product_id: o.productId,
      buyer_id: o.buyerId,
      quantity: o.quantity,
      total_amount: o.totalAmount,
      payment_status: o.paymentStatus,
      razorpay_order_id: o.razorpayOrderId,
      razorpay_payment_id: o.razorpayPaymentId,
      created_at: o.createdAt,
      products: o.product,
      buyer: o.buyerId ? buyerMap.get(o.buyerId) ?? null : null,
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


