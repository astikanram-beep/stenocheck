
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const ADMIN_EMAIL = "prakashra70710@gmail.com";

      if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        signOut(auth);
        router.replace("/admin/login");
        return;
      }

      setAdminEmail(user.email || "");
      setChecking(false);
    });

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

  const services = [
    {
      title: "Delhi High Court PS/APS Typing",
      description:
        "Manage Delhi High Court Private Secretary and Assistant Private Secretary typing passages.",
      icon: "🏛️",
      status: "EXISTING",
      statusStyle: "bg-green-100 text-green-700",
      button: "Manage Delhi Typing",
      buttonStyle: "bg-blue-600 hover:bg-blue-700",
      path: "/admin/delhi-high-court",
    },
    {
      title: "Allahabad High Court PS Typing",
      description:
        "Manage Allahabad High Court PS judgments, passage text and Free/Paid access.",
      icon: "⚖️",
      status: "NEW SECTION",
      statusStyle: "bg-purple-100 text-purple-700",
      button: "Manage PS Typing",
      buttonStyle: "bg-purple-600 hover:bg-purple-700",
      path: "/admin/allahabad-ps-typing",
    },
    {
      title: "AHC Group C and D Typing",
      description:
        "Manage Group C and Group D typing practice in one section.",
      icon: "⌨️",
      status: "NEW SECTION",
      statusStyle: "bg-emerald-100 text-emerald-700",
      button: "Manage Group C & D",
      buttonStyle: "bg-emerald-600 hover:bg-emerald-700",
      path: "/admin/ahc-group-c-d-typing",
    },
    {
      title: "RO/ARO Typing",
      description:
        "Manage Review Officer and Assistant Review Officer typing practice.",
      icon: "📚",
      status: "NEW SECTION",
      statusStyle: "bg-amber-100 text-amber-700",
      button: "Manage RO/ARO",
      buttonStyle: "bg-amber-600 hover:bg-amber-700",
      path: "/admin/ro-aro-typing",
    },
    {
      title: "Steno Passage Checker",
      description:
        "Open the existing stenography passage checking system.",
      icon: "📝",
      status: "EXISTING",
      statusStyle: "bg-green-100 text-green-700",
      button: "Open Steno Checker",
      buttonStyle: "bg-teal-600 hover:bg-teal-700",
      path: "/checker",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
      <header className="border-b border-white bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow">
              SC
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                StenoCheck Admin
              </h1>
              <p className="text-xs text-slate-500">
                Central Administration Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-semibold text-slate-800">
                {adminEmail}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8">
          <p className="text-sm font-bold tracking-widest text-blue-600">
            CENTRAL ADMIN DASHBOARD
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Welcome to StenoCheck
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage Delhi High Court typing, Allahabad High Court PS
            judgments, AHC Group C and D typing, RO/ARO typing and
            stenography checking from one dashboard.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.path}
              className="flex flex-col rounded-3xl border border-white bg-white/95 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                  {service.icon}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${service.statusStyle}`}
                >
                  {service.status}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                {service.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                {service.description}
              </p>

              <button
                type="button"
                onClick={() => router.push(service.path)}
                className={`mt-6 w-full rounded-xl py-3 font-bold text-white transition ${service.buttonStyle}`}
              >
                {service.button}
              </button>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900">
            Admin Overview
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            All typing sections are accessible from this central
            dashboard. The new sections need their management pages
            and data storage to be implemented separately.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm text-blue-700">Delhi High Court</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                Existing
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Current management route
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-5">
              <p className="text-sm text-purple-700">Allahabad PS Typing</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                To Configure
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Judgment library and access control
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700">
                AHC Group C/D and RO/ARO
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">
                To Configure
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Typing management pages
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
