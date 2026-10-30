
"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, authPersistenceReady } from "../lib/firebase";

type OtpMode = "register" | "forgot-password";

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpMode, setOtpMode] = useState<OtpMode>("register");
  const [passwordResetStep, setPasswordResetStep] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    authPersistenceReady
      .then(() => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            window.location.replace("/main-dashboard");
          }
        });
      })
      .catch((err) => {
        console.error("Auth initialization error:", err);
      });

    return () => unsubscribe?.();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to send OTP.");
      }

      setEmail(cleanEmail);
      setOtp("");
      setOtpMode(type);
      setPasswordResetStep(false);
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setOtpStep(true);
      setMessage(
        "OTP sent successfully. Please check your email inbox and spam folder."
      );
    } catch (err: unknown) {
      console.error("SEND OTP ERROR:", err);
      setError(err instanceof Error ? err.message : "Unable to send OTP.");
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
        headers: { "Content-Type": "application/json" },
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
        if (typeof data?.resetToken !== "string" || !data.resetToken) {
          throw new Error(
            "Verification token was not returned. Please request a new OTP."
          );
        }

        setResetToken(data.resetToken);
        setPasswordResetStep(true);
        setOtpStep(false);
        setNewPassword("");
        setConfirmNewPassword("");
        setOtp("");
        setMessage(
          "Email verified successfully. Please enter your new password."
        );
        setOtpMode("forgot-password");
      }
    } catch (err: unknown) {
      console.error("VERIFY OTP ERROR:", err);
      setError(err instanceof Error ? err.message : "Unable to verify OTP.");
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

      await updateProfile(result.user, { displayName: name.trim() });

      setMessage("Account created successfully. Redirecting...");
      window.location.href = "/main-dashboard";
    } catch (err: unknown) {
      console.error("CREATE ACCOUNT ERROR:", err);

      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";

      if (code === "auth/email-already-in-use") {
        throw new Error("This email is already registered.");
      }

      if (code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters.");
      }

      if (code === "auth/invalid-email") {
        throw new Error("Please enter a valid email address.");
      }

      throw new Error(
        err instanceof Error ? err.message : "Unable to create account."
      );
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
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (!resetToken) {
      setError("Verification is missing. Please request and verify a new OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: newPassword,
          resetToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to reset password.");
      }

      setMessage(
        "Password changed successfully. You can now log in with your new password."
      );

      setShowForgot(false);
      setOtpStep(false);
      setPasswordResetStep(false);
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setOtp("");
      setPassword("");
    } catch (err: unknown) {
      console.error("RESET PASSWORD ERROR:", err);
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await authPersistenceReady;

      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      window.location.replace("/main-dashboard");
    } catch (err: unknown) {
      console.error("EMAIL LOGIN ERROR:", err);

      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";

      let errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";

      if (code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      } else if (code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (code === "auth/user-disabled") {
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
      provider.setCustomParameters({ prompt: "select_account" });

      await signInWithPopup(auth, provider);
      window.location.replace("/main-dashboard");
    } catch (err: unknown) {
      console.error("GOOGLE LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegister(!isRegister);
    setShowForgot(false);
    setOtpStep(false);
    setPasswordResetStep(false);
    setResetToken("");
    setError("");
    setMessage("");
    setName("");
    setEmail("");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  function openForgotPassword() {
    setShowForgot(true);
    setIsRegister(false);
    setOtpStep(false);
    setPasswordResetStep(false);
    setResetToken("");
    setError("");
    setMessage("");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  function backToLogin() {
    setShowForgot(false);
    setIsRegister(false);
    setOtpStep(false);
    setPasswordResetStep(false);
    setResetToken("");
    setError("");
    setMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPassword("");
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  const buttonClass =
    "w-full rounded-xl bg-gradient-to-r from-emerald-200 via-sky-200 to-violet-200 px-4 py-3.5 font-bold text-slate-800 shadow-sm transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10"
      style={{
        background:
  "linear-gradient(115deg, #FF9EC5 0%, #FFC18A 18%, #FFE878 35%, #91E6A5 52%, #82D5FF 69%, #B9A0FF 85%, #FF9BCF 100%)",
      }}
    >
      {/* Soft, light pastel rainbow background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "#ffe5ef" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full opacity-50 blur-3xl"
        style={{ background: "#dcf7ff" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[18%] top-[8%] h-48 w-48 rounded-full opacity-40 blur-3xl"
        style={{ background: "#eee5ff" }}
      />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Brand logo and name */}
        <div className="mb-5 flex items-center justify-center gap-3 sm:mb-7">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-sm sm:h-14 sm:w-14">
            <img
              src="/logo.png"
              alt="StenoChecker logo"
              className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
              StenoChecker
            </h1>
            <p className="text-[10px] font-bold tracking-[0.18em] text-slate-500 sm:text-xs">
              PRACTICE WITH PRECISION
            </p>
          </div>
        </div>

        {/* Main login card */}
        <div className="grid overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-[0_24px_80px_rgba(84,91,145,0.14)] backdrop-blur-xl md:grid-cols-2">
          {/* Left side: login, registration and password reset */}
          <section className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-7">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Your practice journey starts here
                </div>

                <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
                  {otpStep
                    ? "Verify OTP"
                    : showForgot
                      ? "Reset Password"
                      : isRegister
                        ? "Create Account"
                        : "Welcome Back!"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {otpStep
                    ? `Enter the 6-digit OTP sent to ${email}`
                    : showForgot
                      ? passwordResetStep
                        ? "Choose a new password for your account."
                        : "Reset your password using email verification."
                      : isRegister
                        ? "Create your StenoChecker account and start practising."
                        : "Login to continue your preparation journey."}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 break-words rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  <p className="font-semibold">Please check</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="mb-4 break-words rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  <p className="font-semibold">Message</p>
                  <p className="mt-1">{message}</p>
                </div>
              )}

              {otpStep ? (
                <>
                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                      className={`${inputClass} text-center text-2xl tracking-[0.5em] placeholder:text-base placeholder:tracking-normal`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading}
                    className={`mt-5 ${buttonClass}`}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => sendOtp(otpMode)}
                    disabled={loading}
                    className="mt-4 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50"
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
                    className="mt-3 w-full text-sm font-semibold text-slate-500 hover:text-slate-700"
                  >
                    ← Back
                  </button>
                </>
              ) : showForgot ? (
                <>
                  {!passwordResetStep ? (
                    <>
                      <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          autoComplete="email"
                          className={inputClass}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => sendOtp("forgot-password")}
                        disabled={loading}
                        className={`mt-5 ${buttonClass}`}
                      >
                        {loading ? "Sending OTP..." : "Send OTP"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className={inputClass}
                        />
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          placeholder="Re-enter new password"
                          className={inputClass}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={resetPassword}
                        disabled={loading}
                        className={`mt-5 ${buttonClass}`}
                      >
                        {loading ? "Changing Password..." : "Change Password"}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={backToLogin}
                    className="mt-5 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    ← Back to Login
                  </button>
                </>
              ) : (
                <>
                  {!isRegister && (
                    <>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="mt-1 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-sm font-extrabold text-blue-600">
                          G
                        </span>
                        {loading ? "Please wait..." : "Continue with Google"}
                      </button>

                      <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[11px] font-semibold tracking-wider text-slate-400">
                          OR CONTINUE WITH EMAIL
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    </>
                  )}

                  {isRegister && (
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <input
                      type="password"
                      autoComplete={
                        isRegister ? "new-password" : "current-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        isRegister
                          ? "Create a password (min. 6 characters)"
                          : "Enter your password"
                      }
                      className={inputClass}
                    />
                  </div>

                  {!isRegister && (
                    <div className="mb-5 mt-3 text-right">
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      isRegister ? sendOtp("register") : handleEmailLogin()
                    }
                    disabled={loading}
                    className={buttonClass}
                  >
                    {loading
                      ? isRegister
                        ? "Sending OTP..."
                        : "Please wait..."
                      : isRegister
                        ? "Send OTP & Register"
                        : "Login to Your Account →"}
                  </button>

                  <p className="mt-6 text-center text-sm text-slate-500">
                    {isRegister
                      ? "Already have an account?"
                      : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {isRegister ? "Login" : "Create account"}
                    </button>
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Right side: light pastel rainbow design */}
          <aside
            className="relative hidden min-h-full flex-col justify-between overflow-hidden p-8 md:flex lg:p-10"
            style={{
              background:
  "linear-gradient(115deg, #FFD6E7 0%, #FFE2C2 18%, #FFF5B8 35%, #D9F8D8 52%, #D5F0FF 69%, #E4D9FF 85%, #FFDDF2 100%)",
            }}
          >
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/50 blur-2xl" />
            <div className="absolute -bottom-12 -left-8 h-52 w-52 rounded-full bg-sky-200/40 blur-2xl" />

            <div className="relative">
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                YOUR EXAM PREPARATION PARTNER
              </span>

              <h3 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-slate-800 lg:text-5xl">
                Better Practice.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-sky-600 to-violet-600 bg-clip-text text-transparent">
                  Brighter Future.
                </span>
              </h3>

              <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
                Build your speed, improve your accuracy, and prepare with
                confidence—one practice session at a time.
              </p>
            </div>

            {/* Decorative practice card */}
            <div className="relative mx-auto my-8 flex w-full max-w-sm items-center justify-center">
              <div className="absolute h-56 w-56 rounded-full border border-white/80 bg-white/30" />
              <div className="absolute h-44 w-44 rounded-full border border-white/80 bg-white/25" />

              <div className="relative flex h-40 w-52 -rotate-3 flex-col justify-between rounded-2xl border border-white/90 bg-white/80 p-4 shadow-[0_20px_45px_rgba(90,100,150,0.16)] backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <span className="text-lg">⌨</span>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-slate-700">
                      Practice Session
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Small steps, big progress
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-sky-100">
                    <div className="h-2 w-4/5 rounded-full bg-sky-400" />
                  </div>
                  <div className="h-2 rounded-full bg-violet-100">
                    <div className="h-2 w-3/5 rounded-full bg-violet-400" />
                  </div>
                  <div className="h-2 rounded-full bg-emerald-100">
                    <div className="h-2 w-2/3 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>

              <span className="absolute -right-1 top-1 text-3xl">✨</span>
              <span className="absolute -left-1 bottom-0 text-3xl">🌱</span>
            </div>

            <div className="relative rounded-2xl border border-white/80 bg-white/55 p-4 backdrop-blur-sm">
              <p className="text-sm font-bold text-slate-700">
                Small Steps. Big Progress!
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Practice • Improve • Succeed
              </p>
            </div>
          </aside>
        </div>

        <p className="mt-5 text-center text-xs font-medium text-slate-500">
          © {new Date().getFullYear()} StenoChecker · Practice with Precision
        </p>
      </div>
    </main>
  );
}
