import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const type =
      body.type === "forgot-password"
        ? "forgot-password"
        : "register";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before saving
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // OTP valid for 10 minutes
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save OTP securely in Firestore
    await adminDb.collection("emailOtps").doc(email).set({
      email,
      type,
      otpHash,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    });

    const subject =
      type === "forgot-password"
        ? "StenoCheck Password Reset OTP"
        : "StenoCheck Email Verification OTP";

    const heading =
      type === "forgot-password"
        ? "Reset your StenoCheck password"
        : "Verify your StenoCheck account";

    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "StenoCheck <verification@stenochecker.in>",
      to: [email],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#1e293b">

          <h2 style="color:#2563eb">
            ${heading}
          </h2>

          <p>
            Your StenoCheck verification code is:
          </p>

          <div style="
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            margin:25px 0;
            color:#111827;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p>
            Do not share this OTP with anyone.
          </p>

          <p>
            If you did not request this code,
            you can safely ignore this email.
          </p>

          <hr style="
            margin:30px 0;
            border:none;
            border-top:1px solid #e5e7eb;
          " />

          <p style="font-size:13px;color:#64748b">
            StenoCheck — Stenography Practice & Passage Checking
          </p>

        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);

      return NextResponse.json(
        { error: "Unable to send OTP email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while sending OTP." },
      { status: 500 }
    );
  }
}