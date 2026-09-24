"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TestData = {
  name: string;
  masterPassage: string;
  typedText: string;
  allottedMinutes: number;
  requiredWpm: number;
};

type ComparisonItem = {
  type: "correct" | "wrong" | "extra" | "missing";
  masterWord?: string;
  typedWord?: string;
};

type ResultData = {
  name: string;
  masterPassage: string;
  typedText: string;
  allottedMinutes: number;
  requiredWpm: number;

  totalWordsTyped: number;
  totalMistakes: number;
  mistakePercentage: number;
  netWpm: number;

  mistakeQualified: boolean;
  speedQualified: boolean;
  passed: boolean;

  comparison: ComparisonItem[];
};

/* =====================================================
   WORD NORMALIZATION
===================================================== */

function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"“”‘’()[\]{}]/g, "");
}

/* =====================================================
   WORD ALIGNMENT
===================================================== */

function compareWords(
  masterWords: string[],
  typedWords: string[]
): ComparisonItem[] {
  const result: ComparisonItem[] = [];

  let i = 0;
  let j = 0;

  while (
    i < masterWords.length ||
    j < typedWords.length
  ) {
    const masterWord = masterWords[i];
    const typedWord = typedWords[j];

    if (
      masterWord &&
      typedWord &&
      normalizeWord(masterWord) ===
        normalizeWord(typedWord)
    ) {
      result.push({
        type: "correct",
        masterWord,
        typedWord,
      });

      i++;
      j++;
      continue;
    }

    /*
     * EXTRA WORD
     *
     * If current typed word matches the NEXT
     * master word, current typed word is extra.
     */

    if (
      typedWord &&
      masterWords[i + 1] &&
      normalizeWord(typedWord) ===
        normalizeWord(masterWords[i + 1])
    ) {
      result.push({
        type: "extra",
        typedWord,
      });

      j++;
      continue;
    }

    /*
     * MISSING WORD
     *
     * If current master word matches the NEXT
     * typed word, master word was skipped.
     */

    if (
      masterWord &&
      typedWords[j + 1] &&
      normalizeWord(masterWord) ===
        normalizeWord(typedWords[j + 1])
    ) {
      result.push({
        type: "missing",
        masterWord,
      });

      i++;
      continue;
    }

    /*
     * WRONG WORD
     */

    if (masterWord && typedWord) {
      result.push({
        type: "wrong",
        masterWord,
        typedWord,
      });

      i++;
      j++;
      continue;
    }

    /*
     * EXTRA WORDS AT END
     */

    if (typedWord && !masterWord) {
      result.push({
        type: "extra",
        typedWord,
      });

      j++;
      continue;
    }

    /*
     * MISSING WORDS AT END
     */

    if (masterWord && !typedWord) {
      result.push({
        type: "missing",
        masterWord,
      });

      i++;
    }
  }

  return result;
}

/* =====================================================
   COUNT MISTAKES
===================================================== */

function countMistakes(
  comparison: ComparisonItem[]
) {
  return comparison.filter(
    (item) =>
      item.type === "wrong" ||
      item.type === "extra" ||
      item.type === "missing"
  ).length;
}

/* =====================================================
   MAIN RESULT PAGE
===================================================== */

export default function DelhiHighCourtResult() {
  const router = useRouter();

  const [result, setResult] =
    useState<ResultData | null>(null);

  useEffect(() => {
    try {
      const saved =
        sessionStorage.getItem(
          "dhcTypingTestData"
        );

      if (!saved) {
        return;
      }

      const data: TestData =
        JSON.parse(saved);

      const typedText =
        data.typedText.trim();

      /*
       * TOTAL TYPED WORDS
       */

      const totalWordsTyped =
        typedText.length > 0
          ? typedText.split(/\s+/).length
          : 0;

      /*
       * MASTER WORDS
       */

      const masterWords =
        data.masterPassage
          .trim()
          .split(/\s+/);

      /*
       * TYPED WORDS
       */

      const typedWords =
        typedText.length > 0
          ? typedText.split(/\s+/)
          : [];

      /*
       * WORD COMPARISON
       */

      const comparison =
        compareWords(
          masterWords,
          typedWords
        );

      /*
       * TOTAL MISTAKES
       */

      const totalMistakes =
        countMistakes(comparison);

      /*
       * MISTAKE %
       */

      const mistakePercentage =
        totalWordsTyped > 0
          ? (totalMistakes /
              totalWordsTyped) *
            100
          : 0;

      /*
       * NET WPM
       *
       * (Typed Words - Mistakes) / 10
       */

      const netWpm =
        (totalWordsTyped -
          totalMistakes) /
        data.allottedMinutes;

      /*
       * QUALIFICATION
       */

      const mistakeQualified =
        mistakePercentage <= 3;

      const speedQualified =
        netWpm >= data.requiredWpm;

      const passed =
        mistakeQualified &&
        speedQualified;

      setResult({
        name: data.name,
        masterPassage:
          data.masterPassage,
        typedText:
          data.typedText,
        allottedMinutes:
          data.allottedMinutes,
        requiredWpm:
          data.requiredWpm,

        totalWordsTyped,
        totalMistakes,
        mistakePercentage,
        netWpm,

        mistakeQualified,
        speedQualified,
        passed,

        comparison,
      });
    } catch (error) {
      console.error(
        "Result calculation error:",
        error
      );
    }
  }, []);

  /*
   * NO RESULT DATA
   */

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">

        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">

          <div className="text-4xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            No Result Found
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Please complete the Delhi High Court
            typing test first.
          </p>

          <button
            onClick={() =>
              router.push(
                "/typing/delhi-high-court/easy"
              )
            }
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            Back to Typing Practice
          </button>

        </div>

      </main>
    );
  }

  /*
   * RESULT PAGE
   */

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                DELHI HIGH COURT
              </p>

              <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
                Typing Test Result
              </h1>

              <p className="mt-2 text-slate-500">
                Candidate:{" "}
                <strong className="text-slate-800">
                  {result.name}
                </strong>
              </p>

            </div>

            {/* PASS / FAIL */}

            <div
              className={`rounded-2xl px-7 py-4 text-center ${
                result.passed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >

              <p className="text-xs font-bold uppercase">
                Final Result
              </p>

              <p className="mt-1 text-3xl font-black">
                {result.passed
                  ? "PASS"
                  : "FAIL"}
              </p>

            </div>

          </div>

        </div>

        {/* MAIN STATS */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Words Typed"
            value={String(
              result.totalWordsTyped
            )}
          />

          <StatCard
            title="Total Mistakes"
            value={String(
              result.totalMistakes
            )}
          />

          <StatCard
            title="Mistake %"
            value={`${result.mistakePercentage.toFixed(
              2
            )}%`}
          />

          <StatCard
            title="Net Speed"
            value={`${result.netWpm.toFixed(
              2
            )} WPM`}
          />

        </div>

        {/* QUALIFICATION */}

        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Qualification Details
          </h2>

          <div className="mt-5 space-y-4">

            <QualificationRow
              title="Mistake Percentage"
              value={`${result.mistakePercentage.toFixed(
                2
              )}%`}
              requirement="Maximum 3%"
              passed={
                result.mistakeQualified
              }
            />

            <QualificationRow
              title="Net Typing Speed"
              value={`${result.netWpm.toFixed(
                2
              )} WPM`}
              requirement={`Required ${result.requiredWpm} WPM`}
              passed={
                result.speedQualified
              }
            />

          </div>

        </div>

        {/* PERFORMANCE */}

        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Performance
          </h2>

          <div className="mt-5">

            {result.passed ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                <p className="text-2xl font-extrabold text-green-700">
                  👍 Good Performance
                </p>

                <p className="mt-2 text-sm text-green-700">
                  Your typing speed and mistake
                  percentage meet the current test
                  criteria.
                </p>

              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

                <p className="text-2xl font-extrabold text-red-700">
                  Keep Practicing
                </p>

                <p className="mt-2 text-sm text-red-700">
                  Improve your accuracy and typing
                  speed and try the test again.
                </p>

              </div>
            )}

          </div>

        </div>

        {/* TEXT COMPARISON */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* MASTER PASSAGE */}

          <div className="rounded-3xl border bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Master Passage
            </h2>

            <div className="mt-4 max-h-[500px] overflow-y-auto rounded-2xl border bg-slate-50 p-5 text-lg leading-8 text-slate-800">

              {result.masterPassage}

            </div>

          </div>

          {/* YOUR TYPING */}

          <div className="rounded-3xl border bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Your Typing
            </h2>

            <ComparisonText
              comparison={
                result.comparison
              }
            />

          </div>

        </div>

        {/* BUTTONS */}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

          <button
            onClick={() =>
              router.push(
                "/typing/delhi-high-court/easy"
              )
            }
            className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white hover:bg-blue-700"
          >
            Try Another Passage
          </button>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-xl border border-slate-300 bg-white px-8 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    </main>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-extrabold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   QUALIFICATION ROW
===================================================== */

function QualificationRow({
  title,
  value,
  requirement,
  passed,
}: {
  title: string;
  value: string;
  requirement: string;
  passed: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <p className="font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {requirement}
        </p>

      </div>

      <div className="flex items-center gap-4">

        <span className="font-bold text-slate-800">
          {value}
        </span>

        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${
            passed
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {passed
            ? "QUALIFIED"
            : "NOT QUALIFIED"}
        </span>

      </div>

    </div>
  );
}

/* =====================================================
   COMPARISON DISPLAY
===================================================== */

function ComparisonText({
  comparison,
}: {
  comparison: ComparisonItem[];
}) {
  if (comparison.length === 0) {
    return (
      <div className="mt-4 max-h-[500px] overflow-y-auto rounded-2xl border bg-slate-50 p-5 text-lg leading-8">

        <span className="text-slate-400">
          No typing submitted.
        </span>

      </div>
    );
  }

  return (
    <div className="mt-4 max-h-[500px] overflow-y-auto rounded-2xl border bg-slate-50 p-5 text-lg leading-8">

      {comparison.map(
        (item, index) => {

          /* CORRECT */

          if (item.type === "correct") {
            return (
              <span key={index}>
                {item.typedWord}{" "}
              </span>
            );
          }

          /* WRONG */

          if (item.type === "wrong") {
            return (
              <span
                key={index}
                title={`Correct: ${item.masterWord}`}
                className="mr-1 rounded bg-red-100 px-1 font-semibold text-red-700"
              >
                {item.typedWord}
              </span>
            );
          }

          /* EXTRA */

          if (item.type === "extra") {
            return (
              <span
                key={index}
                title="Extra word"
                className="mr-1 rounded bg-orange-100 px-1 font-semibold text-orange-700 line-through"
              >
                {item.typedWord}
              </span>
            );
          }

          /* MISSING */

          return (
            <span
              key={index}
              title={`Missing: ${item.masterWord}`}
              className="mr-1 rounded bg-yellow-100 px-1 font-semibold text-yellow-700"
            >
              [Missing: {item.masterWord}]
            </span>
          );
        }
      )}

    </div>
  );
}