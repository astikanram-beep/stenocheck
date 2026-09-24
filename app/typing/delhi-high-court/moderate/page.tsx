"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DelhiHighCourtModerate() {
  const router = useRouter();
  const [showSubscription, setShowSubscription] = useState(false);

  const passages = Array.from({ length: 20 }, (_, index) => index + 1);

  function handlePassageClick(passageNo: number) {
    if (passageNo === 1) {
      alert("Free Passage 01 will open here.");
      return;
    }

    setShowSubscription(true);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Back */}
        <button
          onClick={() =>
            router.push("/typing/delhi-high-court")
          }
          className="mb-8 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          ← Back to Difficulty Levels
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-700">
              MODERATE
            </span>

            <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
              20 Passages
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            Delhi High Court — Moderate Practice
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Practice balanced-level passages to improve your typing
            speed, accuracy and consistency.
          </p>
        </div>

        {/* Free Notice */}
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-3">
            <div className="text-2xl">🔓</div>

            <div>
              <h2 className="font-bold text-emerald-900">
                Passage 01 is Free
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                Try one complete moderate-level typing test for
                free. Other passages require a subscription.
              </p>
            </div>
          </div>
        </div>

        {/* Passage Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {passages.map((passageNo) => {
            const isFree = passageNo === 1;

            return (
              <button
                key={passageNo}
                onClick={() => handlePassageClick(passageNo)}
                className={`group rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                  isFree
                    ? "border-emerald-200 hover:border-emerald-400"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                      isFree
                        ? "bg-emerald-50"
                        : "bg-slate-100"
                    }`}
                  >
                    {isFree ? "🔓" : "🔒"}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isFree
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isFree ? "FREE" : "PAID"}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-900">
                  Passage {String(passageNo).padStart(2, "0")}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  400 words • 10 minutes
                </p>

                <div
                  className={`mt-5 text-sm font-bold ${
                    isFree
                      ? "text-emerald-600"
                      : "text-blue-600"
                  }`}
                >
                  {isFree
                    ? "Start Free Practice →"
                    : "Unlock Passage →"}
                </div>
              </button>
            );
          })}

        </div>

        {/* Subscription Modal */}
        {showSubscription && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8"
            onClick={() => setShowSubscription(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-10"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Close */}
              <button
                onClick={() => setShowSubscription(false)}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>

              {/* Header */}
              <div className="pr-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  🔒
                </div>

                <h2 className="mt-5 text-3xl font-extrabold text-slate-900">
                  Unlock Full Practice
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-slate-600">
                  Get access to all Delhi High Court typing
                  practice passages with a subscription.
                </p>
              </div>

              {/* Plans */}
              <div className="mt-8 grid gap-5 md:grid-cols-3">

                {/* 1 Month */}
                <div className="rounded-2xl border border-slate-200 p-6 text-center">
                  <h3 className="font-bold text-slate-900">
                    1 Month
                  </h3>

                  <div className="mt-3 text-4xl font-extrabold text-blue-700">
                    ₹100
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Full access for 1 month
                  </p>

                  <button
                    onClick={() =>
                      alert("Payment will be connected later.")
                    }
                    className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    Subscribe
                  </button>
                </div>

                {/* 2 Months */}
                <div className="relative rounded-2xl border-2 border-blue-500 p-6 text-center">

                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white">
                    POPULAR
                  </div>

                  <h3 className="font-bold text-slate-900">
                    2 Months
                  </h3>

                  <div className="mt-3 text-4xl font-extrabold text-blue-700">
                    ₹175
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Full access for 2 months
                  </p>

                  <button
                    onClick={() =>
                      alert("Payment will be connected later.")
                    }
                    className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    Subscribe
                  </button>
                </div>

                {/* 3 Months */}
                <div className="rounded-2xl border border-slate-200 p-6 text-center">
                  <h3 className="font-bold text-slate-900">
                    3 Months
                  </h3>

                  <div className="mt-3 text-4xl font-extrabold text-blue-700">
                    ₹250
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Full access for 3 months
                  </p>

                  <button
                    onClick={() =>
                      alert("Payment will be connected later.")
                    }
                    className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
                  >
                    Subscribe
                  </button>
                </div>

              </div>

              {/* Benefits */}
              <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                <h3 className="font-bold text-slate-900">
                  Subscription includes
                </h3>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>✓ Paid typing passages</div>
                  <div>✓ Easy, Moderate & Difficult</div>
                  <div>✓ 10-minute practice tests</div>
                  <div>✓ Detailed accuracy results</div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowSubscription(false)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Maybe Later
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}