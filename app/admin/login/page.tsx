"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../../../lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      /*
       * TEMPORARY ADMIN CHECK
       *
       * अभी जिस email को आप admin बनाना चाहते हैं
       * उसे नीचे डालें।
       */

      const ADMIN_EMAIL = "prakashra70710@gmail.com";

      if (
        result.user.email?.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {
        await signOut(auth);

        setError(
          "This account does not have admin access."
        );

        return;
      }

      window.location.href = "/admin";

    } catch (err: any) {
      console.error(
        "ADMIN LOGIN ERROR:",
        err
      );

      setError(
        err?.message ||
          "Invalid admin email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5">

      <div className="w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-lg">
            SC
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-white">
            StenoCheck Admin
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Secure administration panel
          </p>

        </div>

        {/* LOGIN CARD */}

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">

          <h2 className="text-2xl font-bold text-slate-900">
            Admin Login
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage StenoCheck.
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-bold">
                Login Failed
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>
          )}

          {/* EMAIL */}

          <div className="mt-6">

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Admin Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter admin email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* PASSWORD */}

          <div className="mt-5">

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Login to Admin"}
          </button>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          StenoCheck Administration
        </p>

      </div>

    </main>
  );
}