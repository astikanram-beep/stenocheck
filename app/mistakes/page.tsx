
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Test = {
  id: string;
  exam?: string;
  createdAt?: unknown;
  wrongWords?: unknown;
  missingWords?: unknown;
  extraWords?: unknown;
  spellingMistakes?: unknown;
  punctuationMistakes?: unknown;
  totalMistakes?: unknown;
};

function wordsList(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .flatMap((item) => {
        if (typeof item === "string") {
          return item.trim() ? [item.trim()] : [];
        }

        if (typeof item === "number") {
          return [String(item)];
        }

        // Handle object-shaped mistake entries safely.
        if (typeof item === "object") {
          const record = item as Record<string, unknown>;
          const word =
            record.word ??
            record.text ??
            record.value ??
            record.original ??
            record.typed;

          return typeof word === "string" || typeof word === "number"
            ? [String(word)]
            : [];
        }

        return [];
      });
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }

  if (typeof value === "number") {
    return value > 0 ? [String(value)] : [];
  }

  // Do not crash if Firestore contains an unexpected value.
  return [];
}

function countValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatDate(value: unknown): string {
  if (!value) return "Date unavailable";

  try {
    let date: Date;

    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof value.toDate === "function"
    ) {
      date = value.toDate();
    } else if (
      typeof value === "object" &&
      value !== null &&
      "seconds" in value &&
      typeof value.seconds === "number"
    ) {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value as string | number | Date);
    }

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Date unavailable";
  }
}

function MistakeSection({
  title,
  words,
  gradient,
}: {
  title: string;
  words: string[];
  gradient: string;
}) {
  const counts = new Map<string, number>();

  words.forEach((word) => {
    const key = word.trim();
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  });

  const sortedWords = [...counts.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <section className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
      <div
        className="mb-4 rounded-xl p-4"
        style={{ background: gradient }}
      >
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {words.length} recorded item{words.length === 1 ? "" : "s"}
        </p>
      </div>

      {sortedWords.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">
          No word details have been saved in this category yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedWords.map(([word, count], index) => (
            <span
              key={`${word}-${index}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <span className="break-all">{word}</span>
              {count > 1 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">
                  ×{count}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MistakesPage() {
  const router = useRouter();

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examFilter, setExamFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (!user) {
        router.replace("/");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const testsRef = collection(db, "users", user.uid, "tests");

        let snapshot;

        try {
          snapshot = await getDocs(
            query(testsRef, orderBy("createdAt", "desc"))
          );
        } catch {
          // Support older documents that may not have createdAt.
          snapshot = await getDocs(testsRef);
        }

        if (cancelled) return;

        const loadedTests: Test[] = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Test, "id">),
        }));

        loadedTests.sort((a, b) => {
          const getTimestamp = (value: unknown): number => {
            if (
              typeof value === "object" &&
              value !== null &&
              "toDate" in value &&
              typeof value.toDate === "function"
            ) {
              return value.toDate().getTime();
            }

            if (
              typeof value === "object" &&
              value !== null &&
              "seconds" in value &&
              typeof value.seconds === "number"
            ) {
              return value.seconds * 1000;
            }

            return 0;
          };

          return (
            getTimestamp(b.createdAt) - getTimestamp(a.createdAt)
          );
        });

        setTests(loadedTests);
      } catch (err) {
        console.error("Unable to load mistakes:", err);

        if (!cancelled) {
          setError(
            "Mistakes load nahi ho sakin. Internet connection aur Firebase permissions check karein."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  const filteredTests =
    examFilter === "All"
      ? tests
      : tests.filter(
          (test) =>
            (test.exam || "").toLowerCase() ===
            examFilter.toLowerCase()
        );

  const wrongWords = filteredTests.flatMap((test) =>
    wordsList(test.wrongWords)
  );

  const missingWords = filteredTests.flatMap((test) =>
    wordsList(test.missingWords)
  );

  const extraWords = filteredTests.flatMap((test) =>
    wordsList(test.extraWords)
  );

  const spellingTotal = filteredTests.reduce(
    (sum, test) => sum + countValue(test.spellingMistakes),
    0
  );

  const punctuationTotal = filteredTests.reduce(
    (sum, test) => sum + countValue(test.punctuationMistakes),
    0
  );

  const mistakeTotal = filteredTests.reduce(
    (sum, test) => sum + countValue(test.totalMistakes),
    0
  );

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-6"
        style={{
          background:
            "linear-gradient(135deg,#fff1f2,#fef3c7,#dcfce7,#dbeafe,#f3e8ff)",
        }}
      >
        <div className="rounded-2xl border border-white bg-white/85 p-6 text-center shadow">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="font-semibold text-slate-700">
            Loading your mistakes...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        background:
          "linear-gradient(135deg,#fff1f2 0%,#fef3c7 22%,#dcfce7 44%,#dbeafe 66%,#f3e8ff 84%,#fce7f3 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-5 rounded-xl border border-white bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
        >
          ← Back to Dashboard
        </button>

        <header className="mb-7 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm">
          <h1 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">
            My Mistakes
          </h1>
          <p className="mt-2 text-slate-600">
            Review wrong words, missing words and extra words from
            your saved dictation tests.
          </p>

          <label className="mt-5 block max-w-sm">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Filter by examination
            </span>
            <select
              value={examFilter}
              onChange={(event) => setExamFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="All">All Exams</option>
              <option value="SSC Stenographer">SSC Stenographer</option>
              <option value="DSSSB">DSSSB</option>
              <option value="DHC">DHC</option>
              <option value="AHC">AHC</option>
            </select>
          </label>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Tests Reviewed",
              value: filteredTests.length,
              color: "linear-gradient(135deg,#dbeafe,#ede9fe)",
            },
            {
              label: "Wrong Words",
              value: wrongWords.length,
              color: "linear-gradient(135deg,#ffe4e6,#fecdd3)",
            },
            {
              label: "Missing Words",
              value: missingWords.length,
              color: "linear-gradient(135deg,#fef3c7,#fde68a)",
            },
            {
              label: "Total Mistakes",
              value: mistakeTotal,
              color: "linear-gradient(135deg,#f3e8ff,#fce7f3)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/80 p-4 shadow-sm sm:p-5"
              style={{ background: item.color }}
            >
              <p className="text-sm font-semibold text-slate-600">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <MistakeSection
            title="Wrong Words"
            words={wrongWords}
            gradient="linear-gradient(135deg,#ffe4e6,#fecdd3)"
          />

          <MistakeSection
            title="Missing Words"
            words={missingWords}
            gradient="linear-gradient(135deg,#fef3c7,#fde68a)"
          />

          <MistakeSection
            title="Extra Words"
            words={extraWords}
            gradient="linear-gradient(135deg,#ede9fe,#ddd6fe)"
          />

          <section className="rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
            <div
              className="mb-4 rounded-xl p-4"
              style={{
                background: "linear-gradient(135deg,#dcfce7,#dbeafe)",
              }}
            >
              <h2 className="text-lg font-bold text-slate-800">
                Other Mistake Counts
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Counts recorded in your saved tests
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-slate-600">Spelling Mistakes</span>
                <strong className="text-slate-800">
                  {spellingTotal}
                </strong>
              </div>

              <div className="flex justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-slate-600">
                  Punctuation Mistakes
                </span>
                <strong className="text-slate-800">
                  {punctuationTotal}
                </strong>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-600">Total Mistakes</span>
                <strong className="text-slate-800">
                  {mistakeTotal}
                </strong>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-white/90 bg-white/85 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Saved Test History
          </h2>

          {filteredTests.length === 0 ? (
            <p className="text-sm text-slate-500">
              No saved tests found for this examination.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {test.exam || "Examination not specified"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(test.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                      Wrong: {wordsList(test.wrongWords).length}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                      Missing: {wordsList(test.missingWords).length}
                    </span>
                    <span className="rounded-full bg-purple-50 px-3 py-1.5 text-purple-700">
                      Extra: {wordsList(test.extraWords).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="py-7 text-center text-xs text-slate-500">
          Keep learning. Keep improving. Keep moving forward. 🌈
        </p>
      </div>
    </main>
  );
}
