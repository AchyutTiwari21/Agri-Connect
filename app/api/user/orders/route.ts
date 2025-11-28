import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId') || '';
    if (!buyerId) return NextResponse.json({ error: 'buyerId required' }, { status: 400 });

    const orders = await prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, image: true, category: true } } },
    });

    // Align shape with existing UI expecting `products` key
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
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


