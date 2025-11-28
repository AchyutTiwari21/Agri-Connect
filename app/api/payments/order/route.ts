import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', receipt, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay environment variables not set' }, { status: 500 });
    }

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString('base64');

    const orderPayload: any = {
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    // Include notes if provided
    if (notes) {
      orderPayload.notes = notes;
    }

    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await rpRes.json();
    if (!rpRes.ok) {
      return NextResponse.json({ error: data?.error?.description || 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json({ orderId: data.id }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


