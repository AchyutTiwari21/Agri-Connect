import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, buyer_id, quantity, total_amount, payment_status, razorpay_order_id, razorpay_payment_id } = body;

    if (!product_id || !buyer_id || !quantity || !total_amount || !payment_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          productId: product_id,
          buyerId: buyer_id,
          quantity,
          totalAmount: total_amount,
          paymentStatus: payment_status,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      });

      await tx.product.update({
        where: { id: product_id },
        data: { quantity: { decrement: quantity } },
      });

      return created;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


