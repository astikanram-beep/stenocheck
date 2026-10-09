import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
   let body;

try {
  body = await request.json();
} catch (error) {
  console.error("REQUEST JSON ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      error: "Invalid or empty JSON request body.",
    },
    { status: 400 }
  );
}
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      months,
      amount,
    } = body;

    // Basic payment details check
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing payment verification details.",
        },
        { status: 400 }
      );
    }

    // User check
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not logged in.",
        },
        { status: 401 }
      );
    }

    // Razorpay secret
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing.");

      return NextResponse.json(
        {
          success: false,
          error: "Payment configuration is missing.",
        },
        { status: 500 }
      );
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const isValid =
      generatedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    // Validate subscription plan
    const subscriptionMonths = Number(months);

    if (![1, 2, 3].includes(subscriptionMonths)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid subscription plan.",
        },
        { status: 400 }
      );
    }

    // Dates
    const startDate = new Date();

    const expiryDate = new Date(startDate);

    expiryDate.setMonth(
      expiryDate.getMonth() + subscriptionMonths
    );

    // Save subscription to Firestore
    await adminDb
      .collection("users")
      .doc(userId)
      .set(
        {
          subscription: {
            active: true,
            months: subscriptionMonths,
            amount: Number(amount || 0),
            startDate: startDate.toISOString(),
            expiryDate: expiryDate.toISOString(),

            razorpayOrderId:
              razorpay_order_id,

            razorpayPaymentId:
              razorpay_payment_id,
          },

          updatedAt: new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

    console.log(
      "SUBSCRIPTION ACTIVATED:",
      userId,
      subscriptionMonths,
      expiryDate.toISOString()
    );

    return NextResponse.json({
      success: true,

      message:
        "Payment verified and subscription activated.",

      subscription: {
        active: true,
        months: subscriptionMonths,
        amount: Number(amount || 0),
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "RAZORPAY VERIFY PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}