"use client";

import { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "../lib/firebase";

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth() {
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(result.user, {
          displayName: name,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("EMAIL AUTH ERROR:", err);

      setError(
        `Firebase Error: ${err?.code || "Unknown error"}${
          err?.message ? ` — ${err.message}` : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      console.log("Google login successful:", result.user);

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("GOOGLE LOGIN ERROR:", err);

      setError(
        `Firebase Error: ${err?.code || "Unknown error"}${
          err?.message ? ` — ${err.message}` : ""
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5">
      <div className="w-full max-w-md">
        {/* Logo / Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-700">
            StenoCheck
          </h1>

          <p className="mt-2 text-slate-500">
            Stenography Practice & Passage Checking
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-bold">
            {isRegister ? "Create Account" : "Welcome Back 👋"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {isRegister
              ? "Create your StenoCheck account."
              : "Login to continue to your dashboard."}
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Login Error</p>

              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white py-3 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg font-bold">G</span>

            {loading ? "Please wait..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs text-slate-400">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Name */}
          {isRegister && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
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
            <label className="mb-2 block text-sm font-medium">
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
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">
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

          {/* Email Login/Register */}
          <button
            type="button"
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>

          {/* Switch Login/Register */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}{" "}

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="font-semibold text-blue-600 hover:underline"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}