"use client";

import { useRouter } from "next/navigation";

export default function DelhiHighCourtTyping() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Top Navigation */}
        <button
          onClick={() => router.push("/main-dashboard")}
          className="mb-8 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          ← Back to Main Dashboard
        </button>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-4xl">
            🏛️
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Delhi High Court
          </h1>

          <h2 className="mt-2 text-2xl font-bold text-blue-700">
            Typing Practice
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Improve your typing accuracy and speed with Delhi High Court
            typing practice passages.
          </p>
        </div>

        {/* Difficulty Heading */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            Choose Difficulty Level
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Select a difficulty level to view available typing passages.
          </p>
        </div>

        {/* Difficulty Cards */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Easy */}
          <button
            onClick={() =>
              router.push("/typing/delhi-high-court/easy")
            }
            className="group rounded-2xl border border-emerald-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-3xl">
              🟢
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Easy
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start with simple passages and build your typing
              accuracy and confidence.
            </p>

            <div className="mt-6 font-semibold text-emerald-600">
              View Passages →
            </div>
          </button>

          {/* Moderate */}
          <button
            onClick={() =>
              router.push("/typing/delhi-high-court/moderate")
            }
            className="group rounded-2xl border border-amber-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-3xl">
              🟡
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Moderate
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Practice passages with a balanced level of
              difficulty, speed and accuracy.
            </p>

            <div className="mt-6 font-semibold text-amber-600">
              View Passages →
            </div>
          </button>

          {/* Difficult */}
          <button
            onClick={() =>
              router.push("/typing/delhi-high-court/difficult")
            }
            className="group rounded-2xl border border-red-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-400 hover:shadow-xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-3xl">
              🔴
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Difficult
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Challenge yourself with more complex passages and
              improve your overall typing performance.
            </p>

            <div className="mt-6 font-semibold text-red-600">
              View Passages →
            </div>
          </button>

        </div>

        {/* Test Information */}
        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="font-bold text-slate-900">
            Delhi High Court Typing Practice
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-900">
                Duration:
              </span>{" "}
              10 Minutes
            </div>

            <div>
              <span className="font-semibold text-slate-900">
                Passage:
              </span>{" "}
              400 Words
            </div>

            <div>
              <span className="font-semibold text-slate-900">
                Focus:
              </span>{" "}
              Speed & Accuracy
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}