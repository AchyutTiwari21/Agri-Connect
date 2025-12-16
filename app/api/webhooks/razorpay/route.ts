import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false, // important for raw body
  },
};

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Webhook secret missing");
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    // ⭐ 1. Read RAW BODY (required for Razorpay signature)
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // ⭐ 2. Validate signature
    if (expectedSignature !== signature) {
      console.warn("Signature mismatch");
      return NextResponse.json(
        { status: "failure", message: "Invalid signature" },
        { status: 400 }
      );
    }

    // 3. Parse JSON only after verification
    const body = JSON.parse(rawBody);

    const ack = NextResponse.json({ status: "ok" }, { status: 200 });

    // 4. Background processing — fully detached
    queueMicrotask(async () => {
      try {
        const event = body.event;

        if (event === "payment.authorized") {
          const payment = body.payload.payment.entity;

          const buyerId = payment.notes?.buyerId;
          const cartDataStr = payment.notes?.cartData;
          const orderId = payment.order_id;
          const paymentId = payment.id;

          if (!buyerId || !cartDataStr) {
            console.error("Missing buyerId or cartData in notes");
            return;
          }

          const cartData = JSON.parse(cartDataStr);

          // ⭐ Convert total_amount → integer (avoid float crash)
          for (const item of cartData) {
            item.total_amount = parseInt(item.total_amount, 10) || 0;
          }

          // ⭐ Prisma transaction
          await prisma.$transaction(async (tx) => {
            for (const item of cartData) {
              await tx.order.create({
                data: {
                  productId: item.product_id,
                  buyerId,
                  quantity: item.quantity,
                  totalAmount: item.total_amount,
                  paymentStatus: "completed",
                  razorpayOrderId: orderId,
                  razorpayPaymentId: paymentId,
                },
              });

              await tx.product.update({
                where: { id: item.product_id },
                data: { quantity: { decrement: item.quantity } },
              });
            }
          });

          console.log("✅ Orders created for payment:", paymentId);
        }

        if (event === "payment.failed") {
          console.log("❌ Payment failed");
        }
      } catch (err) {
        console.error("BACKGROUND ERROR:", err);
      }
    });

    // ⭐ 6. Return response instantly
    return ack;
  } catch (err: any) {
    console.error("MAIN WEBHOOK ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
