
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TestRecord = {
  date?: string;
  speed?: number;
  wpm?: number;
  mistakes?: number;
  accuracy?: number;
  level?: string;
  difficulty?: string;
};

const HISTORY_KEY = "dhcTypingTestHistory";

const colors = {
  blue: {
    card: "border-blue-200 bg-blue-50",
    icon: "bg-blue-600",
    text: "text-blue-700",
  },
  pink: {
    card: "border-pink-200 bg-pink-50",
    icon: "bg-pink-500",
    text: "text-pink-700",
  },
  green: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-500",
    text: "text-emerald-700",
  },
  orange: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500",
    text: "text-amber-700",
  },
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function DelhiHighCourtTyping() {
  const router = useRouter();
  const [history, setHistory] = useState<TestRecord[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(-5).reverse());
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const recent = history.slice(0, 5);
  const speedValues = recent.map((test) =>
    Number(test.speed ?? test.wpm ?? 0)
  ).filter((value) => Number.isFinite(value) && value > 0);

  const mistakeValues = recent.map((test) =>
    Number(test.mistakes ?? 0)
  ).filter((value) => Number.isFinite(value) && value >= 0);

  const accuracyValues = recent.map((test) =>
    Number(test.accuracy ?? 0)
  ).filter((value) => Number.isFinite(value) && value >= 0);

  const avgSpeed = average(speedValues);
  const avgMistakes = average(mistakeValues);
  const avgAccuracy = average(accuracyValues);

  const chartValues = [...recent].reverse();
  const maxSpeed = Math.max(40, ...chartValues.map(
    (test) => Number(test.speed ?? test.wpm ?? 0)
  ));
  const chartPoints = chartValues.map((test, index) => {
    const speed = Number(test.speed ?? test.wpm ?? 0);
    const x = chartValues.length <= 1
      ? 300
      : 36 + (index * 528) / (chartValues.length - 1);
    const y = 150 - (speed / maxSpeed) * 115;
    return { x, y, speed, index };
  });

  const line = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = chartPoints.length
    ? `36,150 ${line} ${chartPoints[chartPoints.length - 1].x},150`
    : "";

  const difficulties = [
    {
      name: "Easy",
      subtitle: "Build Your Basics",
      description: "Short and simple passages to build confidence.",
      icon: "🌱",
      color: "emerald",
      route: "/typing/delhi-high-court/easy",
      features: ["Beginner friendly", "Improve accuracy", "Learn at your pace"],
    },
    {
      name: "Moderate",
      subtitle: "Improve Your Speed",
      description: "Balanced passages to improve speed and accuracy.",
      icon: "⚡",
      color: "amber",
      route: "/typing/delhi-high-court/moderate",
      features: ["Medium-length passages", "Speed and accuracy", "Build consistency"],
    },
    {
      name: "Difficult",
      subtitle: "Become a Typing Pro",
      description: "Challenge yourself with complex passages.",
      icon: "🔥",
      color: "rose",
      route: "/typing/delhi-high-court/difficult",
      features: ["Advanced passages", "Challenge your speed", "Exam-style practice"],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push("/main-dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            ← Main Dashboard
          </button>
          <div className="text-right">
            <p className="text-sm font-bold text-blue-700">STENOCHECKER</p>
            <p className="text-xs text-slate-500">Delhi High Court Practice</p>
          </div>
        </div>

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500 p-6 text-white shadow-xl sm:p-9">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-100">
              Your progress starts here
            </p>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">
              Better Typing,
              <br />
              <span className="text-amber-300">Bigger Dreams.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-50 sm:text-base">
              Every test is a new opportunity. Practise with focus, learn from
              your mistakes, and get closer to your goal.
            </p>
            <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">
              ✨ Practice today. Perform better tomorrow.
            </div>
          </div>
          <div className="pointer-events-none absolute -right-4 -top-8 text-[145px] opacity-15 sm:right-8 sm:text-[190px]">
            ⌨️
          </div>
          <div className="pointer-events-none absolute -bottom-16 right-24 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold sm:text-2xl">
                📊 Your Performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your averages from the last five saved tests
              </p>
            </div>
            <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-blue-700">
              Last 5 tests
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Average Speed",
                value: recent.length ? `${avgSpeed.toFixed(1)} WPM` : "—",
                icon: "🚀",
                theme: colors.blue,
                note: "Words per minute",
              },
              {
                label: "Average Mistakes",
                value: mistakeValues.length ? avgMistakes.toFixed(1) : "—",
                icon: "🎯",
                theme: colors.pink,
                note: "Mistakes per test",
              },
              {
                label: "Average Accuracy",
                value: accuracyValues.length ? `${avgAccuracy.toFixed(1)}%` : "—",
                icon: "✅",
                theme: colors.green,
                note: "Typing accuracy",
              },
              {
                label: "Tests Attempted",
                value: history.length ? String(history.length) : "0",
                icon: "🏆",
                theme: colors.orange,
                note: "Saved in this browser",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${item.theme.card}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl text-white shadow-md ${item.theme.icon}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-600">
                      {item.label}
                    </p>
                    <p className={`mt-1 text-2xl font-black ${item.theme.text}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-5 lg:grid-cols-5">
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm lg:col-span-3 sm:p-6">
            <h2 className="text-lg font-extrabold">📈 Last 5 Tests — Speed</h2>
            <p className="mt-1 text-sm text-slate-500">
              Track how your typing speed changes over time.
            </p>

            {chartPoints.length > 0 ? (
              <div className="mt-5">
                <svg
                  viewBox="0 0 600 190"
                  role="img"
                  aria-label="Average speed graph for the last five typing tests"
                  className="w-full overflow-visible"
                >
                  {[35, 73, 111, 150].map((y) => (
                    <line
                      key={y}
                      x1="36"
                      y1={y}
                      x2="564"
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 5"
                    />
                  ))}
                  <polygon points={area} fill="#3b82f6" opacity="0.10" />
                  {chartPoints.length > 1 && (
                    <polyline
                      points={line}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {chartPoints.map((point) => (
                    <g key={`${point.index}-${point.speed}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="#2563eb"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={point.x}
                        y={Math.max(19, point.y - 12)}
                        fontSize="12"
                        fontWeight="700"
                        textAnchor="middle"
                        fill="#1d4ed8"
                      >
                        {point.speed}
                      </text>
                      <text
                        x={point.x}
                        y="176"
                        fontSize="11"
                        textAnchor="middle"
                        fill="#64748b"
                      >
                        Test {point.index + 1}
                      </text>
                    </g>
                  ))}
                </svg>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>← Older tests</span>
                  <span>Speed in WPM</span>
                  <span>Latest test →</span>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/50 p-6 text-center">
                <span className="text-4xl">⌨️</span>
                <p className="mt-3 font-bold text-slate-700">
                  Your progress graph will appear here
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Complete a typing test and save its result to start tracking
                  your speed.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm lg:col-span-2 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌟</span>
              <div>
                <h2 className="text-lg font-extrabold">Your Next Goal</h2>
                <p className="text-sm text-slate-500">Small steps, big progress</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-indigo-100">
              <p className="text-lg font-black text-indigo-800">
                Keep practising. Keep improving.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Don’t worry about one difficult test. Focus on fewer mistakes,
                steady speed, and consistent practice.
              </p>
            </div>
            <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
              <p>💙 Practise with patience</p>
              <p>💚 Learn from every mistake</p>
              <p>💛 Celebrate every improvement</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Choose your next step
            </p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              Choose Your Typing Challenge
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pick your level, open a passage, and start typing. Every practice
              session takes you one step closer to your goal.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {difficulties.map((item) => {
              const themes = {
                emerald: {
                  border: "border-emerald-200 hover:border-emerald-400",
                  bg: "from-emerald-50 to-white",
                  icon: "bg-emerald-500",
                  title: "text-emerald-800",
                  button: "bg-emerald-600 hover:bg-emerald-700",
                  badge: "bg-emerald-100 text-emerald-800",
                },
                amber: {
                  border: "border-amber-200 hover:border-amber-400",
                  bg: "from-amber-50 to-white",
                  icon: "bg-amber-500",
                  title: "text-amber-800",
                  button: "bg-amber-500 hover:bg-amber-600",
                  badge: "bg-amber-100 text-amber-800",
                },
                rose: {
                  border: "border-rose-200 hover:border-rose-400",
                  bg: "from-rose-50 to-white",
                  icon: "bg-rose-500",
                  title: "text-rose-800",
                  button: "bg-rose-600 hover:bg-rose-700",
                  badge: "bg-rose-100 text-rose-800",
                },
              } as const;

              const theme = themes[item.color as keyof typeof themes];

              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.route)}
                  className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${theme.border} ${theme.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl text-white shadow-md ${theme.icon}`}>
                      {item.icon}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${theme.badge}`}>
                      {item.name === "Easy"
                        ? "Beginner Friendly"
                        : item.name === "Moderate"
                          ? "Level Up"
                          : "Challenge Yourself"}
                    </span>
                  </div>

                  <h3 className={`mt-5 text-2xl font-black ${theme.title}`}>
                    {item.name}
                  </h3>
                  <p className="mt-1 font-bold text-slate-800">{item.subtitle}</p>
                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    {item.features.map((feature) => (
                      <p key={feature} className="text-sm text-slate-600">
                        <span className="mr-2 font-black text-emerald-600">✓</span>
                        {feature}
                      </p>
                    ))}
                  </div>

                  <div className={`mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition group-hover:gap-3 ${theme.button}`}>
                    Start Typing Practice <span>→</span>
                  </div>
                  <span className="pointer-events-none absolute -bottom-6 -right-3 text-7xl opacity-10">
                    ⌨️
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-xl font-extrabold">📝 Last 5 Tests Record</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review your recent typing performance.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {recent.length} of 5 shown
            </span>
          </div>

          {recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">#</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Speed</th>
                    <th className="px-5 py-4">Mistakes</th>
                    <th className="px-5 py-4">Accuracy</th>
                    <th className="px-5 py-4">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((test, index) => (
                    <tr key={`${test.date ?? "test"}-${index}`} className="transition hover:bg-blue-50/50">
                      <td className="px-5 py-4 font-bold text-slate-500">{index + 1}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(test.date)}</td>
                      <td className="px-5 py-4 font-extrabold text-blue-700">
                        {test.speed ?? test.wpm ?? "—"} WPM
                      </td>
                      <td className="px-5 py-4 font-semibold text-rose-600">{test.mistakes ?? "—"}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">
                        {test.accuracy != null ? `${test.accuracy}%` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {test.level ?? test.difficulty ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                📋
              </div>
              <h3 className="mt-4 text-lg font-extrabold">
                Your test history will appear here
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Once completed test results are saved, your latest five attempts
                will be shown here with speed, mistakes, accuracy and difficulty.
              </p>
            </div>
          )}
        </section>

        <footer className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-blue-800">
            ⭐ Consistency beats perfection. Keep typing, keep growing!
          </p>
          <p className="mt-1 text-xs text-slate-500">
            StenoChecker • Your practice, your progress.
          </p>
        </footer>
      </div>
    </main>
  );
}
