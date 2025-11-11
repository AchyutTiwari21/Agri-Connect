import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // Ack quickly
    // For now we only acknowledge; mirror logic can be added to update DB similar to the backend example
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


