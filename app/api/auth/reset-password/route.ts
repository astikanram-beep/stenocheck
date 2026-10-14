import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const resetToken = String(body.resetToken || "").trim();

    if (!email || !password || !resetToken) {
      return NextResponse.json(
        {
          error:
            "Email, new password, and verification token are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(resetToken)) {
      return NextResponse.json(
        {
          error:
            "Verification token is invalid. Please verify a new OTP.",
        },
        { status: 400 }
      );
    }

    // Check that this email belongs to an existing Firebase user.
    const user = await adminAuth.getUserByEmail(email);

    const tokenRef = adminDb
      .collection("passwordResetTokens")
      .doc(email);

    const suppliedHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    try {
      // Validate and consume the token transactionally so it cannot
      // be successfully reused for another reset request.
      await adminDb.runTransaction(async (transaction) => {
        const tokenSnap = await transaction.get(tokenRef);

        if (!tokenSnap.exists) {
          throw new Error("RESET_TOKEN_INVALID");
        }

        const tokenData = tokenSnap.data();

        if (!tokenData || tokenData.type !== "forgot-password") {
          throw new Error("RESET_TOKEN_INVALID");
        }

        if (Date.now() > Number(tokenData.expiresAt)) {
          throw new Error("RESET_TOKEN_EXPIRED");
        }

        const storedHash = String(tokenData.tokenHash || "");

        if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
          throw new Error("RESET_TOKEN_INVALID");
        }

        const expected = Buffer.from(storedHash, "hex");
        const provided = Buffer.from(suppliedHash, "hex");

        if (
          expected.length !== provided.length ||
          !crypto.timingSafeEqual(expected, provided)
        ) {
          throw new Error("RESET_TOKEN_INVALID");
        }

        // Delete the temporary token after successful validation.
        transaction.delete(tokenRef);
      });
    } catch (tokenError: unknown) {
      const tokenMessage =
        tokenError instanceof Error ? tokenError.message : "";

      if (tokenMessage === "RESET_TOKEN_EXPIRED") {
        return NextResponse.json(
          {
            error:
              "Verification has expired. Please request a new OTP.",
          },
          { status: 400 }
        );
      }

      if (tokenMessage === "RESET_TOKEN_INVALID") {
        return NextResponse.json(
          {
            error:
              "Verification token is invalid or already used. Please verify a new OTP.",
          },
          { status: 400 }
        );
      }

      throw tokenError;
    }

    // Change the Firebase password only after valid token verification.
    await adminAuth.updateUser(user.uid, {
      password,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: unknown) {
    console.error("RESET PASSWORD ERROR:", error);

    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (errorCode === "auth/user-not-found") {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "Unable to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}