
"use client";

import { useEffect, useState } from "react";

type TestData = {
  name: string;
  masterPassage: string;
  typedText: string;
  allottedMinutes: number;
  requiredWpm: number;
};

type ComparisonItem = {
  type: "correct" | "spelling" | "wrong" | "extra" | "missing";
  masterWord?: string;
  typedWord?: string;
};

type ResultData = {
  totalWordsTyped: number;
  totalMistakes: number;
  fullMistakes: number;
  halfMistakes: number;
  mistakePercentage: number;
  netWpm: number;
  comparison: ComparisonItem[];
};

function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"“”‘’()[\]{}]/g, "")
    .trim();
}

// Damerau-Levenshtein distance: adjacent letter swaps are also considered.
function editDistance(a: string, b: string): number {
  const s = normalizeWord(a);
  const t = normalizeWord(b);

  const rows = s.length + 1;
  const cols = t.length + 1;
  const dp: number[][] = Array.from(
    { length: rows },
    () => Array(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );

      if (
        i > 1 &&
        j > 1 &&
        s[i - 1] === t[j - 2] &&
        s[i - 2] === t[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[s.length][t.length];
}

// Only close spellings are classified as half mistakes.
// This is a heuristic, not a complete English dictionary checker.
function isLikelySpellingMistake(master: string, typed: string): boolean {
  const a = normalizeWord(master);
  const b = normalizeWord(typed);

  if (!a || !b || a === b) return false;
  if (Math.min(a.length, b.length) < 4) return false;

  const distance = editDistance(a, b);
  const maxLength = Math.max(a.length, b.length);

  if (maxLength <= 5) return distance === 1;
  if (maxLength <= 9) return distance <= 2;
  return distance <= 2 && Math.abs(a.length - b.length) <= 2;
}

function compareWords(masterWords: string[], typedWords: string[]) {
  const m = masterWords.length;
  const n = typedWords.length;

  // Dynamic programming aligns the two passages and avoids simple
  // two-pointer comparison cascading into many false Missing errors.
  const dp: number[][] = Array.from(
    { length: m + 1 },
    () => Array(n + 1).fill(0)
  );

  const back: string[][] = Array.from(
    { length: m + 1 },
    () => Array(n + 1).fill("")
  );

  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    back[i][0] = "missing";
  }

  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    back[0][j] = "extra";
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const master = masterWords[i - 1];
      const typed = typedWords[j - 1];
      const a = normalizeWord(master);
      const b = normalizeWord(typed);

      const substitutionCost =
        a === b ? 0 : isLikelySpellingMistake(master, typed) ? 0.5 : 1;

      const choices = [
        {
          cost: dp[i - 1][j - 1] + substitutionCost,
          action: "match",
          priority: 0,
        },
        {
          cost: dp[i - 1][j] + 1,
          action: "missing",
          priority: 1,
        },
        {
          cost: dp[i][j - 1] + 1,
          action: "extra",
          priority: 2,
        },
      ];

      choices.sort((x, y) => x.cost - y.cost || x.priority - y.priority);
      dp[i][j] = choices[0].cost;
      back[i][j] = choices[0].action;
    }
  }

  const result: ComparisonItem[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const action = back[i][j];

    if (i > 0 && j > 0 && action === "match") {
      const masterWord = masterWords[i - 1];
      const typedWord = typedWords[j - 1];
      const masterNormalized = normalizeWord(masterWord);
      const typedNormalized = normalizeWord(typedWord);

      if (masterNormalized === typedNormalized) {
        result.push({
          type: "correct",
          masterWord,
          typedWord,
        });
      } else if (isLikelySpellingMistake(masterWord, typedWord)) {
        result.push({
          type: "spelling",
          masterWord,
          typedWord,
        });
      } else {
        result.push({
          type: "wrong",
          masterWord,
          typedWord,
        });
      }

      i--;
      j--;
    } else if (i > 0 && (j === 0 || action === "missing")) {
      result.push({
        type: "missing",
        masterWord: masterWords[i - 1],
      });
      i--;
    } else if (j > 0) {
      result.push({
        type: "extra",
        typedWord: typedWords[j - 1],
      });
      j--;
    } else {
      break;
    }
  }

  return result.reverse();
}

function calculateResults(data: TestData): ResultData {
  const masterWords = data.masterPassage.trim()
    ? data.masterPassage.trim().split(/\s+/)
    : [];

  const typedWords = data.typedText.trim()
    ? data.typedText.trim().split(/\s+/)
    : [];

  const comparison = compareWords(masterWords, typedWords);

  const fullMistakes = comparison.filter(
    (item) =>
      item.type === "wrong" ||
      item.type === "extra" ||
      item.type === "missing"
  ).length;

  const halfMistakes = comparison.filter(
    (item) => item.type === "spelling"
  ).length;

  const totalMistakes = fullMistakes + halfMistakes * 0.5;
  const totalWordsTyped = typedWords.length;

  const mistakePercentage =
    totalWordsTyped > 0 ? (totalMistakes / totalWordsTyped) * 100 : 0;

  const allottedMinutes = Math.max(1, data.allottedMinutes);
  const netWpm = Math.max(
    0,
    (totalWordsTyped - totalMistakes) / allottedMinutes
  );

  return {
    totalWordsTyped,
    totalMistakes,
    fullMistakes,
    halfMistakes,
    mistakePercentage,
    netWpm,
    comparison,
  };
}

export default function DelhiHighCourtResult() {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("dhcTypingTestData");

      if (!saved) return;

      const parsed = JSON.parse(saved) as TestData;

      if (
        typeof parsed.masterPassage !== "string" ||
        typeof parsed.typedText !== "string"
      ) {
        console.error("Saved test data is missing the passage or typed text.");
        return;
      }

      const safeData: TestData = {
        name: parsed.name || "",
        masterPassage: parsed.masterPassage,
        typedText: parsed.typedText,
        allottedMinutes: Number(parsed.allottedMinutes) || 10,
        requiredWpm: Number(parsed.requiredWpm) || 40,
      };

      setTestData(safeData);
      setResult(calculateResults(safeData));
    } catch (error) {
      console.error("Could not load DHC result data:", error);
    }
  }, []);

  if (!testData || !result) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Delhi High Court Result</h1>
          <p className="mt-3">
            Test result data nahi mila. Please test complete karke dobara
            submit karein.
          </p>
        </div>
      </main>
    );
  }

  const passed =
    result.mistakePercentage <= 3 &&
    result.netWpm >= testData.requiredWpm;

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Delhi High Court Typing Result
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Candidate: {testData.name || "Candidate"}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 font-semibold ${
              passed
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {passed ? "Qualified" : "Not Qualified"}
          </span>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Words Typed" value={result.totalWordsTyped} />
          <Stat
            label="Full Mistakes"
            value={result.fullMistakes}
          />
          <Stat
            label="Half Mistakes"
            value={result.halfMistakes}
          />
          <Stat
            label="Total Mistakes"
            value={result.totalMistakes.toFixed(1)}
          />
          <Stat
            label="Mistake Percentage"
            value={`${result.mistakePercentage.toFixed(2)}%`}
          />
          <Stat
            label="Net Speed"
            value={`${result.netWpm.toFixed(2)} WPM`}
          />
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Mistake Legend</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-green-700">Green: Correct</span>
            <span className="text-orange-600">Orange: Spelling (½)</span>
            <span className="text-red-700">Red: Wrong word (1)</span>
            <span className="text-purple-700">Purple: Extra word (1)</span>
            <span className="text-blue-700">Blue: Missing word (1)</span>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Passage Comparison</h2>

          <div className="whitespace-pre-wrap break-words leading-8">
            {result.comparison.map((item, index) => {
              if (item.type === "correct") {
                return (
                  <span key={index} className="text-green-700">
                    {item.typedWord}{" "}
                  </span>
                );
              }

              if (item.type === "spelling") {
                return (
                  <span
                    key={index}
                    className="rounded bg-orange-50 text-orange-700"
                    title={`Spelling: ${item.typedWord} → ${item.masterWord} (½ mistake)`}
                  >
                    {item.typedWord}
                    <span className="text-xs font-bold">½</span>{" "}
                  </span>
                );
              }

              if (item.type === "wrong") {
                return (
                  <span
                    key={index}
                    className="text-red-700"
                    title={`Expected: ${item.masterWord}`}
                  >
                    {item.typedWord}
                    <span className="text-xs font-bold"> [Expected: {item.masterWord}]</span>{" "}
                  </span>
                );
              }

              if (item.type === "extra") {
                return (
                  <span key={index} className="text-purple-700">
                    {item.typedWord}
                    <span className="text-xs font-bold"> [Extra]</span>{" "}
                  </span>
                );
              }

              return (
                <span key={index} className="text-blue-700">
                  [Missing: {item.masterWord}]{" "}
                </span>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Original Passage</h2>
          <p className="whitespace-pre-wrap break-words leading-7">
            {testData.masterPassage}
          </p>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">Your Typed Text</h2>
          <p className="whitespace-pre-wrap break-words leading-7">
            {testData.typedText}
          </p>
        </section>

        <button
          onClick={() => {
            window.location.href = "/typing/delhi-high-court/easy";
          }}
          className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
        >
          Back to Passages
        </button>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}