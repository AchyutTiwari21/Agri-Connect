import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 });
    }

    const signature = req.headers.get('x-razorpay-signature') || '';
    const body = await req.json();

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
    shasum.update(JSON.stringify(body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return NextResponse.json({ status: 'failure', message: 'Invalid signature' }, { status: 400 });
    }

    // ✅ Immediately acknowledge webhook
    const response = NextResponse.json({ status: 'ok' }, { status: 200 });

    // Continue processing in background (don't block response)
    const event = body.event;

    // Process payment events asynchronously without blocking response
    (async () => {
      if (event === 'payment.captured') {
        const payment = body.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;

        // Extract cart data from payment notes
        if (payment.notes && payment.notes.cartData && payment.notes.buyerId) {
          try {
            const cartData = JSON.parse(payment.notes.cartData);
            const buyerId = payment.notes.buyerId;

            // Create orders for each cart item
            await prisma.$transaction(async (tx) => {
              for (const item of cartData) {
                // Create order
                await tx.order.create({
                  data: {
                    productId: item.product_id,
                    buyerId: buyerId,
                    quantity: item.quantity,
                    totalAmount: item.total_amount,
                    paymentStatus: 'completed',
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                  },
                });

                // Update product quantity
                await tx.product.update({
                  where: { id: item.product_id },
                  data: { quantity: { decrement: item.quantity } },
                });
              }
            });

            console.log('✅ Payment successful and orders created:', paymentId);
          } catch (err: any) {
            console.error('⚠️ Error processing payment.captured:', err.message);
          }
        } else {
          console.error('⚠️ Missing cart data or buyerId in payment notes for order:', orderId);
        }
      } else if (event === 'payment.failed') {
        const payment = body.payload.payment.entity;
        console.log('❌ Payment failed:', payment.id);
        // Do not create orders for failed payments
      }
    })().catch((err) => {
      console.error('Webhook background processing error:', err.message);
    });

    return response;
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


