
"use client";

import { useEffect, useState } from "react";

type PerformancePoint = {
  minute: number;
  speed: number;
  wordsTyped?: number;
  mistakes?: number;
  elapsedSeconds?: number;
};

type TestData = {
  name?: string;
  masterPassage: string;
  typedText: string;
  allottedMinutes: number;
  requiredWpm: number;
  elapsedSeconds?: number;
  backspaceCount?: number;
  backspaceUsed?: number;
  performanceHistory?: PerformancePoint[];
};

type ComparisonItem = {
  type: "correct" | "spelling" | "wrong" | "extra" | "missing";
  masterWord?: string;
  typedWord?: string;
};

type ResultData = {
  totalWordsTyped: number;
  fullMistakes: number;
  halfMistakes: number;
  totalMistakes: number;
  mistakePercentage: number;
  netWpm: number;
  comparison: ComparisonItem[];
};

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[.,!?;:"“”‘’()[\]{}]/g, "").trim();
}

function editDistance(a: string, b: string): number {
  const s = normalizeWord(a);
  const t = normalizeWord(b);
  const dp: number[][] = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0)
  );

  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
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

function isLikelySpellingMistake(master: string, typed: string): boolean {
  const a = normalizeWord(master);
  const b = normalizeWord(typed);

  if (!a || !b || a === b || Math.min(a.length, b.length) < 4) return false;

  const distance = editDistance(a, b);
  const maxLength = Math.max(a.length, b.length);

  if (maxLength <= 5) return distance === 1;
  if (maxLength <= 9) return distance <= 2;

  return distance <= 2 && Math.abs(a.length - b.length) <= 2;
}

function compareWords(
  masterWords: string[],
  typedWords: string[]
): ComparisonItem[] {
  const m = masterWords.length;
  const n = typedWords.length;

  if (n === 0) return [];

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  const back: string[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill("")
  );

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    back[i][0] = "missing";
  }

  for (let j = 0; j <= n; j++) {
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
        { cost: dp[i - 1][j] + 1, action: "missing", priority: 1 },
        { cost: dp[i][j - 1] + 1, action: "extra", priority: 2 },
      ].sort((a, b) => a.cost - b.cost || a.priority - b.priority);

      dp[i][j] = choices[0].cost;
      back[i][j] = choices[0].action;
    }
  }

  // Passage ke aakhiri untyped words ko missing mistakes nahi ginte.
  let endI = 0;
  let bestCost = Number.POSITIVE_INFINITY;

  for (let i = 1; i <= m; i++) {
    if (dp[i][n] < bestCost) {
      bestCost = dp[i][n];
      endI = i;
    }
  }

  const result: ComparisonItem[] = [];
  let i = endI;
  let j = n;

  while (j > 0) {
    const action = back[i][j];

    if (i > 0 && action === "match") {
      const masterWord = masterWords[i - 1];
      const typedWord = typedWords[j - 1];

      if (normalizeWord(masterWord) === normalizeWord(typedWord)) {
        result.push({ type: "correct", masterWord, typedWord });
      } else if (isLikelySpellingMistake(masterWord, typedWord)) {
        result.push({ type: "spelling", masterWord, typedWord });
      } else {
        result.push({ type: "wrong", masterWord, typedWord });
      }

      i--;
      j--;
    } else if (i > 0 && action === "missing") {
      result.push({ type: "missing", masterWord: masterWords[i - 1] });
      i--;
    } else {
      result.push({ type: "extra", typedWord: typedWords[j - 1] });
      j--;
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

  const elapsedSeconds =
    typeof data.elapsedSeconds === "number" &&
    Number.isFinite(data.elapsedSeconds) &&
    data.elapsedSeconds > 0
      ? data.elapsedSeconds
      : Math.max(1, (Number(data.allottedMinutes) || 10) * 60);

  const netWpm = Math.max(
    0,
    (totalWordsTyped - totalMistakes) / (elapsedSeconds / 60)
  );

  return {
    totalWordsTyped,
    fullMistakes,
    halfMistakes,
    totalMistakes,
    mistakePercentage,
    netWpm,
    comparison,
  };
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)} min ${safe % 60} sec`;
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MistakeGraph({
  fullMistakes,
  halfMistakes,
  totalWordsTyped,
}: {
  fullMistakes: number;
  halfMistakes: number;
  totalWordsTyped: number;
}) {
  const max = Math.max(fullMistakes, halfMistakes, 1);

  return (
    <div className="space-y-4">
      <Bar
        label="Full mistakes"
        value={fullMistakes}
        max={max}
        color="bg-red-500"
      />
      <Bar
        label="Spelling mistakes"
        value={halfMistakes}
        max={max}
        color="bg-amber-500"
      />
      <Bar
        label="Correctly typed words (approx.)"
        value={Math.max(0, totalWordsTyped - fullMistakes - halfMistakes)}
        max={Math.max(totalWordsTyped, 1)}
        color="bg-emerald-500"
      />
    </div>
  );
}

function SpeedGraph({
  history,
  targetSpeed,
}: {
  history: PerformancePoint[];
  targetSpeed: number;
}) {
  if (history.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        Is test ke liye time-wise speed history save nahi hui. Graph dikhane ke
        liye typing page par performance tracking save honi chahiye.
      </p>
    );
  }

  const points = history.map((point, index) => ({
    ...point,
    safeSpeed: Math.max(0, Number(point.speed) || 0),
    x: history.length === 1 ? 50 : 8 + (index / (history.length - 1)) * 84,
  }));

  const maxSpeed = Math.max(
    targetSpeed * 1.25,
    ...points.map((p) => p.safeSpeed),
    1
  );

  const chartTop = 12;
  const chartBottom = 88;

  const yFor = (speed: number) =>
    chartBottom -
    (Math.max(0, speed) / maxSpeed) * (chartBottom - chartTop);

  const targetY = yFor(targetSpeed);
  const polyline = points
    .map((p) => `${p.x},${yFor(p.safeSpeed)}`)
    .join(" ");

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const firstLabel =
    firstPoint.elapsedSeconds != null
      ? formatDuration(firstPoint.elapsedSeconds)
      : `Min ${firstPoint.minute}`;

  const lastLabel =
    lastPoint.elapsedSeconds != null
      ? formatDuration(lastPoint.elapsedSeconds)
      : `Min ${lastPoint.minute}`;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label="Typing speed line graph and target speed"
          className="h-64 w-full min-w-[320px] overflow-visible"
        >
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const y = yFor(tick);
            if (y < chartTop || y > chartBottom) return null;

            return (
              <g key={tick}>
                <line
                  x1="8"
                  y1={y}
                  x2="92"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="0.35"
                />
                <text
                  x="5"
                  y={y + 1.5}
                  fontSize="3"
                  fill="#64748b"
                  textAnchor="end"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <line
            x1="8"
            y1={targetY}
            x2="92"
            y2={targetY}
            stroke="#d97706"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />

          <text
            x="91"
            y={Math.max(5, targetY - 2)}
            fontSize="3.2"
            fill="#b45309"
            textAnchor="end"
          >
            {targetSpeed} WPM target
          </text>

          {points.length > 1 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="#64748b"
              strokeWidth="0.9"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {points.map((point, index) => {
            const color =
              point.safeSpeed > targetSpeed
                ? "#16a34a"
                : point.safeSpeed < targetSpeed
                  ? "#dc2626"
                  : "#d97706";

            const pointTime =
              point.elapsedSeconds != null
                ? formatDuration(point.elapsedSeconds)
                : `Minute ${point.minute}`;

            return (
              <circle
                key={`${point.minute}-${index}`}
                cx={point.x}
                cy={yFor(point.safeSpeed)}
                r="1.7"
                fill={color}
                stroke="#ffffff"
                strokeWidth="0.5"
              >
                <title>
                  {`${pointTime}: ${point.safeSpeed.toFixed(1)} WPM`}
                </title>
              </circle>
            );
          })}

          <text
            x="8"
            y="97"
            fontSize="3.2"
            fill="#64748b"
            textAnchor="start"
          >
            {firstLabel}
          </text>

          <text
            x="92"
            y="97"
            fontSize="3.2"
            fill="#64748b"
            textAnchor="end"
          >
            {lastLabel}
          </text>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          Above target
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          Below target
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
          Exactly target
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-amber-600" />
          Target speed
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[300px] text-left text-sm">
          <thead>
            <tr className="border-b text-slate-500">
              <th className="px-3 py-2 font-medium">Test time</th>
              <th className="px-3 py-2 font-medium">Speed</th>
              <th className="px-3 py-2 font-medium">Target status</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => {
              const above = point.safeSpeed > targetSpeed;
              const equal = point.safeSpeed === targetSpeed;

              const pointTime =
                point.elapsedSeconds != null
                  ? formatDuration(point.elapsedSeconds)
                  : `Minute ${point.minute}`;

              return (
                <tr
                  key={`detail-${point.minute}-${index}`}
                  className="border-b last:border-0"
                >
                  <td className="px-3 py-2">{pointTime}</td>
                  <td className="px-3 py-2 font-semibold">
                    {point.safeSpeed.toFixed(1)} WPM
                  </td>
                  <td
                    className={`px-3 py-2 font-semibold ${
                      above
                        ? "text-emerald-700"
                        : equal
                          ? "text-amber-700"
                          : "text-red-700"
                    }`}
                  >
                    {above
                      ? "Above target"
                      : equal
                        ? "On target"
                        : "Below target"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        X-axis: test time. Y-axis: recorded speed in WPM. Point colours show
        whether each saved speed meets the target.
      </p>
    </div>
  );
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
        elapsedSeconds:
          typeof parsed.elapsedSeconds === "number" &&
          Number.isFinite(parsed.elapsedSeconds)
            ? parsed.elapsedSeconds
            : undefined,
        backspaceCount:
          typeof parsed.backspaceCount === "number"
            ? parsed.backspaceCount
            : typeof parsed.backspaceUsed === "number"
              ? parsed.backspaceUsed
              : undefined,
        performanceHistory: Array.isArray(parsed.performanceHistory)
          ? parsed.performanceHistory
              .filter(
                (point) =>
                  typeof point?.minute === "number" &&
                  typeof point?.speed === "number"
              )
              .sort(
                (a, b) =>
                  (a.elapsedSeconds ?? a.minute * 60) -
                  (b.elapsedSeconds ?? b.minute * 60)
              )
          : [],
      };

      setTestData(safeData);
      setResult(calculateResults(safeData));
    } catch (error) {
      console.error("Could not load DHC result data:", error);
    }
  }, []);

  if (!testData || !result) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Delhi High Court Typing Result
          </h1>
          <p className="mt-3 text-slate-600">
            Test result data nahi mila. Please test complete karke dobara submit
            karein.
          </p>
          <button
            onClick={() => {
              window.location.href = "/typing/delhi-high-court/easy";
            }}
            className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Back to Passages
          </button>
        </div>
      </main>
    );
  }

  const passed =
    result.mistakePercentage <= 3 &&
    result.netWpm >= testData.requiredWpm;

  const history = testData.performanceHistory || [];
  const historySpeeds = history.map((item) =>
    Math.max(0, Number(item.speed) || 0)
  );

  const averageSpeed =
    historySpeeds.length > 0
      ? historySpeeds.reduce((sum, speed) => sum + speed, 0) /
        historySpeeds.length
      : result.netWpm;

  const bestSpeed =
    historySpeeds.length > 0
      ? Math.max(...historySpeeds)
      : result.netWpm;

  const finalRecordedSpeed =
    historySpeeds.length > 0
      ? historySpeeds[historySpeeds.length - 1]
      : result.netWpm;

  const maxHistorySpeed = Math.max(
    testData.requiredWpm,
    result.netWpm,
    ...historySpeeds,
    1
  );

  const actualDuration =
    typeof testData.elapsedSeconds === "number" &&
    testData.elapsedSeconds > 0
      ? testData.elapsedSeconds
      : testData.allottedMinutes * 60;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-8 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Delhi High Court
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Typing Test Result
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Candidate: {testData.name || "Candidate"}
            </p>
          </div>

          <span
            className={`rounded-full px-5 py-2 text-sm font-bold ${
              passed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {passed ? "QUALIFIED" : "NOT QUALIFIED"}
          </span>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Words Typed" value={result.totalWordsTyped} />
          <Stat
            label="Net Speed"
            value={`${result.netWpm.toFixed(2)} WPM`}
            detail={`Required: ${testData.requiredWpm} WPM`}
          />
          <Stat
            label="Total Mistakes"
            value={result.totalMistakes.toFixed(1)}
          />
          <Stat
            label="Mistake Percentage"
            value={`${result.mistakePercentage.toFixed(2)}%`}
            detail="Target: 3% or less"
          />
          <Stat label="Full Mistakes" value={result.fullMistakes} />
          <Stat
            label="Half Mistakes"
            value={result.halfMistakes}
            detail="Spelling mistakes"
          />
          <Stat
            label="Backspace Used"
            value={
              typeof testData.backspaceCount === "number"
                ? testData.backspaceCount
                : "Not recorded"
            }
          />
          <Stat
            label="Actual Test Duration"
            value={formatDuration(actualDuration)}
            detail={`Time limit: ${testData.allottedMinutes} minutes`}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Best Recorded Speed"
            value={`${bestSpeed.toFixed(1)} WPM`}
            detail="Highest saved time-point speed"
          />
          <Stat
            label="Average Recorded Speed"
            value={`${averageSpeed.toFixed(1)} WPM`}
            detail="Average of saved time points"
          />
          <Stat
            label="Final Recorded Speed"
            value={`${finalRecordedSpeed.toFixed(1)} WPM`}
            detail="Last saved time-point speed"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Speed vs Required Speed</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">
              Net speed calculated using recorded actual duration.
            </p>
            <div className="space-y-5">
              <Bar
                label="Your net speed (WPM)"
                value={result.netWpm}
                max={maxHistorySpeed}
                color="bg-blue-600"
              />
              <Bar
                label="Required speed (WPM)"
                value={testData.requiredWpm}
                max={maxHistorySpeed}
                color="bg-slate-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">
              Time-wise Speed Line Graph
            </h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">
              Green = above target, red = below target, amber = exactly target.
            </p>
            <SpeedGraph
              history={history}
              targetSpeed={testData.requiredWpm}
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Mistake Analysis</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Breakdown calculated from the typed passage.
          </p>
          <MistakeGraph
            fullMistakes={result.fullMistakes}
            halfMistakes={result.halfMistakes}
            totalWordsTyped={result.totalWordsTyped}
          />

          <div className="mt-6 space-y-3 border-t pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Mistake requirement</span>
              <strong
                className={
                  result.mistakePercentage <= 3
                    ? "text-emerald-700"
                    : "text-red-700"
                }
              >
                {result.mistakePercentage <= 3 ? "Passed" : "Not passed"}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Speed requirement</span>
              <strong
                className={
                  result.netWpm >= testData.requiredWpm
                    ? "text-emerald-700"
                    : "text-red-700"
                }
              >
                {result.netWpm >= testData.requiredWpm
                  ? "Passed"
                  : "Not passed"}
              </strong>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Mistake Colour Legend</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <span className="font-medium text-emerald-700">
              Green: Correct word
            </span>
            <span className="font-medium text-amber-700">
              Orange: Possible spelling mistake (½)
            </span>
            <span className="font-medium text-red-700">
              Red: Wrong word (1)
            </span>
            <span className="font-medium text-purple-700">
              Purple: Extra word (1)
            </span>
            <span className="font-medium text-blue-700">
              Blue: Missing word (1)
            </span>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">
            Your Typed Passage — Highlighted Mistakes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Wrong, extra, and spelling words are shown in different colours.
          </p>

          <div className="mt-4 whitespace-pre-wrap break-words rounded-xl border bg-slate-50 p-4 text-base leading-8 sm:p-6">
            {result.comparison.map((item, index) => {
              if (item.type === "correct") {
                return (
                  <span key={index} className="text-emerald-700">
                    {item.typedWord}{" "}
                  </span>
                );
              }

              if (item.type === "spelling") {
                return (
                  <span
                    key={index}
                    className="rounded bg-amber-100 px-0.5 text-amber-800"
                    title={`Expected: ${item.masterWord}`}
                  >
                    {item.typedWord}
                    <sup className="ml-0.5 font-bold">½</sup>{" "}
                  </span>
                );
              }

              if (item.type === "wrong") {
                return (
                  <span
                    key={index}
                    className="rounded bg-red-100 px-0.5 text-red-800"
                    title={`Expected: ${item.masterWord}`}
                  >
                    {item.typedWord}
                    <sup className="ml-0.5 font-bold">W</sup>{" "}
                  </span>
                );
              }

              if (item.type === "extra") {
                return (
                  <span
                    key={index}
                    className="rounded bg-purple-100 px-0.5 text-purple-800"
                    title="Extra word"
                  >
                    {item.typedWord}
                    <sup className="ml-0.5 font-bold">E</sup>{" "}
                  </span>
                );
              }

              return (
                <span
                  key={index}
                  className="rounded bg-blue-100 px-0.5 text-blue-800"
                  title="Missing word inside the attempted passage"
                >
                  [Missing: {item.masterWord}]
                  <sup className="ml-0.5 font-bold">M</sup>{" "}
                </span>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Original Passage</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">
            {testData.masterPassage}
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Plain Typed Text</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">
            {testData.typedText || "No text was typed."}
          </p>
        </section>

        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            onClick={() => {
              window.location.href = "/typing/delhi-high-court/easy";
            }}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Back to Passages
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Print Result
          </button>
        </div>

        <p className="text-xs leading-5 text-slate-500 print:hidden">
          Note: Graph summaries use only performance points saved by the typing
          page. This app's speed and mistake calculations are not confirmation
          of the official Delhi High Court evaluation formula.
        </p>
      </div>
    </main>
  );
}
