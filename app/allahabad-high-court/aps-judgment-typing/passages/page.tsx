
"use client";

import { useRouter } from "next/navigation";

const initialPassages = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  title: `APS Judgment Passage ${index + 1}`,
  difficulty:
    index < 10 ? "Easy" : index < 20 ? "Moderate" : "Difficult",
}));

export default function APSPassageSelectionPage() {
  const router = useRouter();

  const handleSelectPassage = (passage: (typeof initialPassages)[number]) => {
    sessionStorage.setItem("apsSelectedPassageId", String(passage.id));
    sessionStorage.setItem("apsSelectedPassageTitle", passage.title);

    router.push("/allahabad-high-court/aps-judgment-typing");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-cyan-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-purple-700">
              STENOCHECKER.IN
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
              APS Judgment Passages
            </h1>

            <p className="mt-2 text-gray-600">
              Select a passage to begin your typing practice.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/allahabad-high-court")}
            className="rounded-xl border border-white bg-white/80 px-5 py-3 font-semibold text-gray-800 shadow-sm transition hover:bg-white"
          >
            ← Back to Dashboard
          </button>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total passages</p>
            <p className="mt-1 text-3xl font-extrabold text-purple-700">
              30
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Available now</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">
              30
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">More passages</p>
            <p className="mt-1 text-3xl font-extrabold text-blue-700">
              Admin upload
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-lg md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Choose Your Passage
            </h2>

            <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800">
              Passages 1–30
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialPassages.map((passage) => (
              <article
                key={passage.id}
                className="rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      Passage {passage.id}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-gray-900">
                      {passage.title}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      passage.difficulty === "Easy"
                        ? "bg-emerald-100 text-emerald-800"
                        : passage.difficulty === "Moderate"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {passage.difficulty}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPassage(passage)}
                  className="mt-5 w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700"
                >
                  Select Passage →
                </button>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-5 text-center text-sm leading-6 text-gray-600">
          Note: These are demo passage entries. The actual judgment text and
          admin-managed passage library will be connected separately.
        </p>
      </div>
    </main>
  );
}
