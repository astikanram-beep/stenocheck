"use client";

import { useRouter } from "next/navigation";

export default function MainDashboard() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-medium text-blue-600">
            Welcome to
          </p>

          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
            StenoChecker
          </h1>

          <p className="mt-2 text-slate-600">
            Choose a practice section to continue.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Steno Passage Check */}
          <button
            onClick={() => router.push("/dashboard")}
            className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl">
              📝
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Steno Passage Check
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Check your stenography passage, identify mistakes and
              analyze your performance.
            </p>

            <div className="mt-6 font-semibold text-blue-600">
              Open Steno Test →
            </div>
          </button>

          {/* Delhi High Court */}
          <button
            onClick={() => router.push("/typing/delhi-high-court")}
            className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-3xl">
              🏛️
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Delhi High Court
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Practice Delhi High Court typing passages with
              accuracy and speed.
            </p>

            <div className="mt-6 font-semibold text-red-600">
              Typing Practice →
            </div>
          </button>

          {/* Allahabad High Court */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 opacity-80 shadow-sm">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-3xl">
              🏛️
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Allahabad High Court
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Allahabad High Court typing practice will be
              available soon.
            </p>

            <div className="mt-6 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
              Coming Soon
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-400">
          StenoChecker • Practice • Improve • Perform
        </div>

      </div>
    </main>
  );
}