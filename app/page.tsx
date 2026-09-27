"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { auth } from "../lib/firebase";

type OtpMode = "register" | "forgot-password";

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otpMode, setOtpMode] = useState<OtpMode>("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep user logged in until manual logout
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("Persistence error:", err);
    });
  }, []);

  async function sendOtp(type: OtpMode) {
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (type === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!password) {
        setError("Please enter a password.");
        return;
      }

      if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to send OTP.");
      }

      setEmail(cleanEmail);
      setOtp("");
      setOtpMode(type);
      setOtpStep(true);

      setMessage(
        "OTP sent successfully. Please check your email inbox and spam folder."
      );
    } catch (err: any) {
      console.error("SEND OTP ERROR:", err);
      setError(err?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          type: otpMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Invalid OTP.");
      }

      if (otpMode === "register") {
        await createAccountAfterVerification();
      } else {
        setOtpStep(false);
        setNewPassword("");
        setOtp("");

        setMessage(
          "Email verified successfully. Please enter your new password."
        );
        setOtpMode("forgot-password");
      }
    } catch (err: any) {
      console.error("VERIFY OTP ERROR:", err);
      setError(err?.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function createAccountAfterVerification() {
    try {
      await setPersistence(auth, browserLocalPersistence);

      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      setMessage("Account created successfully. Redirecting...");

      window.location.href = "/main-dashboard";
    } catch (err: any) {
      console.error("CREATE ACCOUNT ERROR:", err);

      if (err?.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered.");
      }

      if (err?.code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters.");
      }

      if (err?.code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.");
      }

      throw new Error(err?.message || "Unable to create account.");
    }
  }

  async function resetPassword() {
    setError("");
    setMessage("");

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to reset password.");
      }

      setMessage(
        "Password changed successfully. You can now login with your new password."
      );

      setShowForgot(false);
      setOtpStep(false);
      setNewPassword("");
      setOtp("");
      setPassword("");
    } catch (err: any) {
      console.error("RESET PASSWORD ERROR:", err);
      setError(err?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      window.location.href = "/main-dashboard";
    } catch (err: any) {
      console.error("EMAIL LOGIN ERROR:", err);

      let errorMessage = err?.message || "Something went wrong.";

      if (err?.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      } else if (err?.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err?.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      window.location.href = "/main-dashboard";
    } catch (err: any) {
      console.error("GOOGLE LOGIN ERROR:", err);

      setError(
        err?.message || "Unable to login with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegister(!isRegister);
    setShowForgot(false);
    setOtpStep(false);

    setError("");
    setMessage("");

    setName("");
    setEmail("");
    setPassword("");
    setOtp("");
    setNewPassword("");
  }

  function openForgotPassword() {
    setShowForgot(true);
    setIsRegister(false);
    setOtpStep(false);

    setError("");
    setMessage("");

    setPassword("");
    setOtp("");
    setNewPassword("");
  }

  function backToLogin() {
    setShowForgot(false);
    setIsRegister(false);
    setOtpStep(false);

    setError("");
    setMessage("");

    setOtp("");
    setNewPassword("");
    setPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="StenoCheck"
            className="mx-auto mb-4 h-20 w-20 object-contain"
          />

          <h1 className="text-4xl font-extrabold text-blue-700">
            StenoCheck
          </h1>

          <p className="mt-2 text-slate-500">
            Stenography Practice & Passage Checking
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-xl">

          {/* Heading */}
          <h2 className="text-2xl font-bold text-slate-900">
            {otpStep
              ? "Verify OTP"
              : showForgot
              ? "Reset Password"
              : isRegister
              ? "Create Account"
              : "Welcome Back 👋"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {otpStep
              ? `Enter the 6-digit OTP sent to ${email}`
              : showForgot
              ? "Reset your password using email verification."
              : isRegister
              ? "Create your StenoCheck account."
              : "Login to continue to your dashboard."}
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Notice</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="mt-5 break-words rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <p className="font-semibold">Success</p>
              <p className="mt-1">{message}</p>
            </div>
          )}

          {/* OTP SCREEN */}
          {otpStep ? (
            <>
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  6-Digit OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-lg border px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={verifyOtp}
                disabled={loading}
                className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => sendOtp(otpMode)}
                disabled={loading}
                className="mt-4 w-full text-sm font-semibold text-blue-600 hover:underline"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                className="mt-4 w-full text-sm font-semibold text-slate-500 hover:underline"
              >
                ← Back
              </button>
            </>
          ) : showForgot ? (
            <>
              {/* Forgot Password */}
              {!newPassword ? (
                <>
                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => sendOtp("forgot-password")}
                    disabled={loading}
                    className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      New Password
                    </label>

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={resetPassword}
                    disabled={loading}
                    className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Changing Password..." : "Change Password"}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={backToLogin}
                className="mt-5 w-full text-sm font-semibold text-blue-600 hover:underline"
              >
                ← Back to Login
              </button>
            </>
          ) : (
            <>
              {/* Google Login */}
              {!isRegister && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white py-3 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-lg font-bold">G</span>

                    {loading
                      ? "Please wait..."
                      : "Continue with Google"}
                  </button>

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="text-xs text-slate-400">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </>
              )}

              {/* Name */}
              {isRegister && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Email */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Forgot Password */}
              {!isRegister && (
                <div className="mb-5 text-right">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Login / Send OTP */}
              <button
                type="button"
                onClick={() =>
                  isRegister
                    ? sendOtp("register")
                    : handleEmailLogin()
                }
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? isRegister
                    ? "Sending OTP..."
                    : "Please wait..."
                  : isRegister
                  ? "Send OTP"
                  : "Login"}
              </button>

              {/* Switch */}
              <p className="mt-6 text-center text-sm text-slate-500">
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}

                <button
                  type="button"
                  onClick={switchMode}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {isRegister ? "Login" : "Register"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}