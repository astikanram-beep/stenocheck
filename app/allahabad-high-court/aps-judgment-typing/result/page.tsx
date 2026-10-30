
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Attempt = {
  candidateName?: string;
  referenceText?: string;
  typedText?: string;
  elapsedSeconds?: number;
  timeLimitSeconds?: number;
  submittedAt?: string;
};

type Status = "correct" | "missing" | "wrong" | "extra";

type ComparisonRow = {
  expected: string;
  actual: string;
  status: Status;
};

function normalizeWords(text: string): string[] {
  return (
    text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ||
    []
  );
}

function compareWords(reference: string, typed: string) {
  const expected = normalizeWords(reference);
  const actual = normalizeWords(typed);

  const rows: ComparisonRow[] = [];
  let i = 0;
  let j = 0;
  let missing = 0;
  let wrong = 0;
  let extra = 0;
  let correct = 0;

  while (i < expected.length || j < actual.length) {
    if (i >= expected.length) {
      rows.push({ expected: "—", actual: actual[j], status: "extra" });
      extra++;
      j++;
      continue;
    }

    if (j >= actual.length) {
      rows.push({ expected: expected[i], actual: "Missing", status: "missing" });
      missing++;
      i++;
      continue;
    }

    if (expected[i] === actual[j]) {
      rows.push({
        expected: expected[i],
        actual: actual[j],
        status: "correct",
      });
      correct++;
      i++;
      j++;
      continue;
    }

    if (expected[i + 1] === actual[j]) {
      rows.push({ expected: expected[i], actual: "Missing", status: "missing" });
      missing++;
      i++;
      continue;
    }

    if (expected[i] === actual[j + 1]) {
      rows.push({ expected: "—", actual: actual[j], status: "extra" });
      extra++;
      j++;
      continue;
    }

    rows.push({
      expected: expected[i],
      actual: actual[j],
      status: "wrong",
    });
    wrong++;
    i++;
    j++;
  }

  const accuracy = expected.length
    ? Math.round((correct / expected.length) * 1000) / 10
    : 0;

  return {
    rows,
    expectedCount: expected.length,
    typedCount: actual.length,
    correct,
    missing,
    wrong,
    extra,
    accuracy,
  };
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);

  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(
    safe % 60
  ).padStart(2, "0")}`;
}

/*
  Preserve spaces and punctuation while highlighting words.
  The passage remains readable instead of showing a comparison table.
*/
function HighlightedPassage({
  text,
  statuses,
  type,
}: {
  text: string;
  statuses: Status[];
  type: "typed" | "original";
}) {
  const parts =
    text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu) ||
    [];

  let wordIndex = 0;

  return (
    <div className="whitespace-pre-wrap break-words font-serif text-base leading-8 text-gray-800">
      {parts.map((part, index) => {
        const isWord = /^[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*$/u.test(
          part
        );

        if (!isWord) {
          return <span key={index}>{part}</span>;
        }

        const status = statuses[wordIndex] || "correct";
        wordIndex++;

        const shouldHighlight =
          type === "typed"
            ? status === "wrong" || status === "extra"
            : status === "wrong" || status === "missing";

        if (!shouldHighlight) {
          return <span key={index}>{part}</span>;
        }

        const isExtra = type === "typed" && status === "extra";
        const isMissing = type === "original" && status === "missing";

        const colorClass = isExtra
          ? "bg-sky-200 text-sky-950"
          : isMissing
          ? "bg-amber-200 text-amber-950"
          : "bg-rose-200 text-rose-950";

        const label = isExtra
          ? "Extra word"
          : isMissing
          ? "Missing word"
          : "Wrong word";

        return (
          <mark
            key={index}
            title={label}
            className={`rounded px-1 py-0.5 font-semibold ${colorClass}`}
          >
            {part}
          </mark>
        );
      })}
    </div>
  );
}

export default function APSJudgmentResultPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("apsJudgmentAttempt");

      if (saved) {
        setAttempt(JSON.parse(saved));
      }
    } catch {
      setAttempt(null);
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-purple-50 p-10 text-center">
        Loading result...
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-cyan-100 p-5">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900">
            No result found
          </h1>
          <p className="mt-3 text-gray-600">
            Please complete a practice test first. Your result is stored in
            this browser session.
          </p>
          <button
            onClick={() =>
              router.push("/allahabad-high-court/aps-judgment-typing/test")
            }
            className="mt-6 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Go to Test
          </button>
        </div>
      </main>
    );
  }

  const reference = attempt.referenceText || "";
  const typed = attempt.typedText || "";
  const result = compareWords(reference, typed);
  const elapsed = attempt.elapsedSeconds || 0;

  const speed =
    elapsed > 0
      ? Math.round((result.typedCount / elapsed) * 60 * 10) / 10
      : 0;

  const score = result.expectedCount
    ? Math.round((result.correct / result.expectedCount) * 1000) / 10
    : 0;

  /*
    Statuses are aligned with the words in each passage.
    Missing words have no position in the typed passage.
    Extra words have no position in the original passage.
  */
  const typedStatuses = result.rows
    .filter((row) => row.status !== "missing")
    .map((row) => row.status);

  const originalStatuses = result.rows
    .filter((row) => row.status !== "extra")
    .map((row) => row.status);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-cyan-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-purple-700">
              STENOCHECKER.IN
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
              APS Judgment Typing Result
            </h1>
            <p className="mt-2 text-gray-600">
              Candidate: {attempt.candidateName || "Candidate"}
            </p>
          </div>

          <button
            onClick={() => router.push("/allahabad-high-court")}
            className="rounded-xl border border-white bg-white/80 px-5 py-3 font-semibold text-gray-800 shadow-sm hover:bg-white"
          >
            Back to Allahabad High Court
          </button>
        </header>

        {/* Score and performance metrics */}
        <section className="grid gap-6 rounded-3xl bg-white p-6 shadow-lg md:grid-cols-[240px_1fr] md:items-center md:p-8">
          <div className="flex justify-center">
            <div
              className="relative flex h-48 w-48 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#8b5cf6 ${
                  score * 3.6
                }deg, #ede9fe 0deg)`,
              }}
            >
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="text-4xl font-extrabold text-purple-700">
                  {score.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-gray-500">
                  out of 100
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Text comparison score
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-gray-600">
              This is a provisional text-match percentage for this demo. It
              is not an official examination score, and it does not assess
              document formatting, layout, punctuation, or legal typing rules.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric
                label="Text accuracy"
                value={`${result.accuracy}%`}
              />
              <Metric
                label="Words typed"
                value={String(result.typedCount)}
              />
              <Metric label="Approx. WPM" value={String(speed)} />
              <Metric label="Time used" value={formatTime(elapsed)} />
            </div>
          </div>
        </section>

        {/* Word counts */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CountCard
            label="Correct words"
            count={result.correct}
            color="emerald"
          />
          <CountCard
            label="Missing words"
            count={result.missing}
            color="amber"
          />
          <CountCard
            label="Wrong words"
            count={result.wrong}
            color="rose"
          />
          <CountCard
            label="Extra words"
            count={result.extra}
            color="sky"
          />
        </section>

        {/* Highlight legend */}
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900">
            Mistake highlight guide
          </h2>

          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
            <span className="rounded-lg bg-rose-100 px-3 py-2 text-rose-800">
              Wrong words
            </span>
            <span className="rounded-lg bg-sky-100 px-3 py-2 text-sky-800">
              Extra words
            </span>
            <span className="rounded-lg bg-amber-100 px-3 py-2 text-amber-900">
              Missing words
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Wrong and extra words are highlighted in your typed passage.
            Missing words are highlighted in the original passage.
          </p>
        </section>

        {/* Typed passage first */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-lg md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Typed Passage
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your submitted text with mistakes highlighted.
              </p>
            </div>
            <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800">
              {result.typedCount} words
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-7">
            {typed ? (
              <HighlightedPassage
                text={typed}
                statuses={typedStatuses}
                type="typed"
              />
            ) : (
              <p className="text-gray-500">No text was typed.</p>
            )}
          </div>
        </section>

        {/* Original passage beneath typed passage */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-lg md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Original Judgment
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Compare this reference passage with your typed passage above.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              {result.expectedCount} words
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-7">
            {reference ? (
              <HighlightedPassage
                text={reference}
                statuses={originalStatuses}
                type="original"
              />
            ) : (
              <p className="text-gray-500">No reference text available.</p>
            )}
          </div>
        </section>

        <footer className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong>Important:</strong> Formatting mistakes, paragraph layout,
          punctuation and official marking deductions are not yet included.
          The score above is a demo text-match percentage only. The attempt
          is stored in session storage, not in the permanent database.
        </footer>

        {/* Navigation buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() =>
              router.push("/allahabad-high-court/aps-judgment-typing/test")
            }
            className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow hover:bg-purple-700"
          >
            Practice Again
          </button>

          <button
            onClick={() => router.push("/allahabad-high-court")}
            className="rounded-xl border border-white bg-white px-6 py-3 font-semibold text-gray-800 shadow hover:bg-gray-50"
          >
            Back to Options
          </button>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function CountCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || colors.sky}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{count}</p>
    </div>
  );
}
