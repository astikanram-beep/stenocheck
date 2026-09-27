"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../../lib/firebase";

export default function AdminDashboard() {
  const router = useRouter();

  const [adminEmail, setAdminEmail] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.replace("/admin/login");
          return;
        }

        /*
         * Admin email check
         */

        const ADMIN_EMAIL =
          "prakashra70710@gmail.com";

        if (
          user.email?.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase()
        ) {
          signOut(auth);
          router.replace("/admin/login");
          return;
        }

        setAdminEmail(user.email || "");
        setChecking(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/admin/login");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-lg">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-slate-700">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-sm">
              SC
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                StenoCheck Admin
              </h1>

              <p className="text-xs text-slate-500">
                Administration Panel
              </p>
            </div>

          </div>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-500">
                Logged in as
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {adminEmail}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* WELCOME */}

        <div className="mb-8">

          <p className="text-sm font-semibold text-blue-600">
            ADMIN PANEL
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
            Welcome to StenoCheck
          </h2>

          <p className="mt-2 max-w-2xl text-slate-500">
            Manage typing practice, stenography checking,
            passages and other StenoCheck services from one
            place.
          </p>

        </div>

        {/* SERVICE CARDS */}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {/* DELHI HIGH COURT */}

          <div className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

            <div className="flex items-start justify-between">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                🏛️
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                ACTIVE
              </span>

            </div>

            <h3 className="mt-5 text-xl font-extrabold text-slate-900">
              Delhi High Court
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage Delhi High Court typing practice
              passages and difficulty levels.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/admin/delhi-high-court"
                )
              }
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              Manage Passages
            </button>

          </div>

          {/* ALLAHABAD HIGH COURT */}

          <div className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

            <div className="flex items-start justify-between">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
                ⚖️
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                COMING SOON
              </span>

            </div>

            <h3 className="mt-5 text-xl font-extrabold text-slate-900">
              Allahabad High Court
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage Allahabad High Court typing
              practice passages.
            </p>

            <button
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 font-bold text-slate-400"
            >
              Coming Soon
            </button>

          </div>

          {/* STENO CHECKER */}

          <div className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

            <div className="flex items-start justify-between">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                ⌨️
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                ACTIVE
              </span>

            </div>

            <h3 className="mt-5 text-xl font-extrabold text-slate-900">
              Steno Passage Checker
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage the existing stenography passage
              checking system.
            </p>

            <button
              onClick={() =>
                router.push("/checker")
              }
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Open Steno Checker
            </button>

          </div>

        </div>

        {/* QUICK INFO */}

        <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">

          <h3 className="text-lg font-bold text-slate-900">
            Admin Quick Info
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Delhi High Court
              </p>

              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                0
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Passages added
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Allahabad High Court
              </p>

              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                0
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Passages added
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Steno Checker
              </p>

              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                Active
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Existing system
              </p>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}