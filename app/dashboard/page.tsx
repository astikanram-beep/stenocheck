
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { auth, db } from "../../lib/firebase";

type TestResult = {
  id: string;
  accuracy?: number;
  totalMistakes?: number;
  createdAt?: any;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  const [stats, setStats] = useState({
    testsAttempted: 0,
    averageAccuracy: 0,
    totalMistakes: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/";
        return;
      }

      setUser(currentUser);
      setPhotoError(false);

      try {
        const testsRef = collection(
          db,
          "users",
          currentUser.uid,
          "tests"
        );

        const testsQuery = query(
          testsRef,
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(testsQuery);

        const loadedTests: TestResult[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TestResult[];

        const totalTests = loadedTests.length;

        const totalAccuracy = loadedTests.reduce(
          (sum, test) => sum + Number(test.accuracy || 0),
          0
        );

        const totalMistakes = loadedTests.reduce(
          (sum, test) => sum + Number(test.totalMistakes || 0),
          0
        );

        setStats({
          testsAttempted: totalTests,
          averageAccuracy:
            totalTests > 0 ? totalAccuracy / totalTests : 0,
          totalMistakes,
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("");

  const rainbowBackground = {
    background:
      "linear-gradient(125deg, #ffd5e8 0%, #ffe8bb 22%, #d8f8d7 43%, #c9efff 65%, #e5d6ff 83%, #ffd5ef 100%)",
  };

  const rainbowStrip = {
    background:
      "linear-gradient(90deg, #ff73b9, #ffbd69, #fff080, #77dfa5, #72d7ff, #9c8cff, #e6a1ff)",
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={rainbowBackground}
      >
        <div className="rounded-3xl border border-white/80 bg-white/75 p-8 text-center shadow-lg backdrop-blur">
          <div
            className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-200"
            style={{
              borderTopColor: "#a78bfa",
              borderRightColor: "#7dd3fc",
            }}
          />
          <p className="mt-4 font-semibold text-slate-700">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen text-slate-900"
      style={rainbowBackground}
    >
      {/* Bright pastel rainbow strip */}
      <div className="h-2.5" style={rainbowStrip} />

      {/* Header */}
      <header className="border-b border-white/70 bg-white/60 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, #f9b8df, #b9c9ff, #a9eddf)",
              }}
            >
              <span aria-hidden="true">⌨️</span>
            </div>

            <div>
              <h1
                className="bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #10b981)",
                }}
              >
                StenoCheck
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm">
                Stenography Practice &amp; Analysis
              </p>
            </div>
          </div>

          {/* Profile only — no Logout button */}
          <div className="flex min-w-0 items-center gap-3 rounded-full border border-white/90 bg-white/75 py-1.5 pl-1.5 pr-3 shadow-sm">
            {user?.photoURL && !photoError ? (
              <img
                key={user.photoURL}
                src={user.photoURL}
                alt={`${displayName}'s profile`}
                referrerPolicy="no-referrer"
                onError={() => setPhotoError(true)}
                className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                style={{
                  outline: "2px solid #d8c7ff",
                  outlineOffset: "1px",
                }}
              />
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-slate-800 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #ffcee7, #d9ccff, #b9edff)",
                }}
              >
                {initials || "U"}
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-40 truncate text-sm font-bold text-slate-800">
                {displayName}
              </p>
              <p className="max-w-48 truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Welcome banner */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/80 p-6 shadow-md sm:p-9"
          style={{
            background:
              "linear-gradient(110deg, rgba(255,199,227,.95), rgba(255,234,191,.92), rgba(203,248,218,.92), rgba(190,235,255,.95), rgba(225,207,255,.95))",
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "rgba(255, 137, 203, .35)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "rgba(95, 205, 255, .35)" }}
          />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-violet-700">
                Your practice space
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Welcome,{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #ec4899, #9333ea, #2563eb)",
                  }}
                >
                  {displayName}
                </span>{" "}
                👋
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                Keep practicing, keep improving. Your hard work today
                builds your success tomorrow.
              </p>
            </div>

            <div className="max-w-56 rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur-sm">
              <span className="text-3xl">🌈</span>
              <p className="mt-2 font-semibold italic text-violet-800">
                Small steps every day lead to big results.
              </p>
              <div
                className="mt-3 h-1.5 w-20 rounded-full"
                style={rainbowStrip}
              />
            </div>
          </div>
        </div>

        {/* Three statistics */}
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Tests Attempted"
            value={stats.testsAttempted.toString()}
            icon="📝"
            theme="purple"
            note="Your practice journey"
          />

          <StatCard
            title="Average Accuracy"
            value={
              stats.testsAttempted > 0
                ? `${stats.averageAccuracy.toFixed(1)}%`
                : "—"
            }
            icon="🎯"
            theme="green"
            note="Across all saved tests"
          />

          <StatCard
            title="Total Mistakes"
            value={stats.totalMistakes.toString()}
            icon="📝"
            theme="pink"
            note="Mistakes recorded so far"
          />
        </div>

        {/* Main navigation cards */}
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <ActionCard
            href="/checker"
            title="New Dictation Test"
            description="Start a new stenography passage checking test."
            buttonText="Start Test"
            icon="✍️"
            theme="rainbow"
            decoration="🌈"
          />

          <ActionCard
            href="/results"
            title="My Test Results"
            description="View your saved dictation tests and track your performance."
            buttonText="View Results"
            icon="📊"
            theme="blue"
            decoration="✨"
          />

          <ActionCard
            href="/mistakes"
            title="My Mistakes"
            description="Review your spelling, missing-word and wrong-word mistakes."
            buttonText="View Mistakes"
            icon="🔎"
            theme="pink"
            decoration="🌈"
          />
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-600">
          Keep learning. Keep improving. Keep moving forward. 🌈
        </p>
      </section>
    </main>
  );
}

/* Statistics cards */
function StatCard({
  title,
  value,
  icon,
  theme,
  note,
}: {
  title: string;
  value: string;
  icon: string;
  theme: "purple" | "green" | "pink";
  note: string;
}) {
  const styles = {
    purple: {
      card: "border-violet-200",
      background:
        "linear-gradient(135deg, rgba(255,255,255,.94), #f1e5ff, #e4e6ff)",
      iconBackground:
        "linear-gradient(135deg, #edc8ff, #c8c9ff, #c6eaff)",
      accent: "text-violet-700",
    },
    green: {
      card: "border-emerald-200",
      background:
        "linear-gradient(135deg, rgba(255,255,255,.94), #d9fbe6, #c9f5f1)",
      iconBackground:
        "linear-gradient(135deg, #a8f0d0, #9de8ee, #b8d4ff)",
      accent: "text-emerald-700",
    },
    pink: {
      card: "border-pink-200",
      background:
        "linear-gradient(135deg, rgba(255,255,255,.94), #ffe4e8, #fbe0f3)",
      iconBackground:
        "linear-gradient(135deg, #ffc6df, #ffd9b6, #d9c9ff)",
      accent: "text-pink-700",
    },
  };

  const s = styles[theme];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${s.card}`}
      style={{ background: s.background }}
    >
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-28 w-32 rounded-full bg-white/40 blur-xl" />

      <div className="relative flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
          style={{ background: s.iconBackground }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700 sm:text-base">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {value}
          </p>
          <p className={`mt-2 text-xs font-semibold sm:text-sm ${s.accent}`}>
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Navigation cards */
function ActionCard({
  href,
  title,
  description,
  buttonText,
  icon,
  theme,
  decoration,
}: {
  href: string;
  title: string;
  description: string;
  buttonText: string;
  icon: string;
  theme: "rainbow" | "blue" | "pink";
  decoration: string;
}) {
  const styles = {
    rainbow: {
      cardBackground:
        "linear-gradient(145deg, #ffe0ee 0%, #ffebc5 45%, #fff5c7 100%)",
      iconBackground:
        "linear-gradient(135deg, #ffc4e5, #d5bfff, #a9e5ff, #b5f0d2)",
      buttonBackground:
        "linear-gradient(90deg, #e99ad7, #b4a4ff, #8bd6ee, #9de3c0)",
      decorationColor: "#d47cc4",
      border: "border-pink-200",
    },
    blue: {
      cardBackground:
        "linear-gradient(145deg, #d7efff 0%, #d3f6f5 48%, #d5f8e6 100%)",
      iconBackground:
        "linear-gradient(135deg, #a9dcff, #a5e8e4, #c6c5ff)",
      buttonBackground:
        "linear-gradient(90deg, #91cfff, #8de0e6, #9ee5c8)",
      decorationColor: "#6cafd5",
      border: "border-sky-200",
    },
    pink: {
      cardBackground:
        "linear-gradient(145deg, #f2e0ff 0%, #ffdeed 50%, #ffe6d7 100%)",
      iconBackground:
        "linear-gradient(135deg, #ffbfdf, #d7bdff, #a9e8ff, #ffd5c0)",
      buttonBackground:
        "linear-gradient(90deg, #e4b0f5, #c6b7ff, #9edcf7, #ffbcd9)",
      decorationColor: "#b17bd5",
      border: "border-fuchsia-200",
    },
  };

  const s = styles[theme];

  return (
    <div
      className={`group relative flex min-h-72 flex-col overflow-hidden rounded-3xl border p-6 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${s.border}`}
      style={{ background: s.cardBackground }}
    >
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-white/40 transition group-hover:scale-110" />

      <div className="relative flex flex-1 flex-col">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-sm ring-1 ring-white/80"
          style={{ background: s.iconBackground }}
        >
          {icon}
        </div>

        <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h3>

        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-700 sm:text-base">
          {description}
        </p>

        <div className="mt-auto pt-6">
          <button
            onClick={() => {
              window.location.href = href;
            }}
            className="inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:brightness-105 hover:shadow-md"
            style={{ background: s.buttonBackground }}
          >
            {buttonText}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-5 right-5 select-none text-5xl opacity-70 transition group-hover:scale-110"
        style={{ color: s.decorationColor }}
      >
        {decoration}
      </div>

      <div
        className="absolute bottom-0 left-0 h-1.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, #ff83bd, #ffc46e, #fff18a, #83dfa9, #7dd8ff, #a493ff, #e8a4ff)",
        }}
      />
    </div>
  );
}
