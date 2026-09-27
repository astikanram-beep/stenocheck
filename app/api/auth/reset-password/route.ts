import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and new password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const user = await adminAuth.getUserByEmail(email);

    await adminAuth.updateUser(user.uid, {
      password,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    console.error("RESET PASSWORD ERROR:", error);

    if (error?.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Unable to reset password." },
      { status: 500 }
    );
  }
}