import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        {
          error: "Invalid amount. Minimum amount is ₹1.",
        },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: "INR",
      receipt: `stenocheck_${Date.now()}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("RAZORPAY CREATE ORDER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.error?.description ||
          error?.message ||
          "Unable to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}