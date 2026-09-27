import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const otp = String(body.otp || "").trim();

    const type =
      body.type === "forgot-password"
        ? "forgot-password"
        : "register";

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const ref = adminDb.collection("emailOtps").doc(email);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "OTP not found. Please request a new OTP." },
        { status: 400 }
      );
    }

    const data = snap.data();

    if (!data) {
      return NextResponse.json(
        { error: "Invalid OTP request." },
        { status: 400 }
      );
    }

    if (data.type !== type) {
      return NextResponse.json(
        { error: "Invalid OTP request." },
        { status: 400 }
      );
    }

    if (Date.now() > Number(data.expiresAt)) {
      await ref.delete();

      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const attempts = Number(data.attempts || 0);

    if (attempts >= 5) {
      await ref.delete();

      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 400 }
      );
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (otpHash !== data.otpHash) {
      await ref.update({
        attempts: attempts + 1,
      });

      return NextResponse.json(
        {
          error: `Incorrect OTP. ${
            4 - attempts
          } attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // OTP is valid
    await ref.delete();

    return NextResponse.json({
      success: true,
      verified: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while verifying OTP." },
      { status: 500 }
    );
  }
}