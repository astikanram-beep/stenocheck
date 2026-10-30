
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type TestResult = {
  id: string;
  exam?: string;
  duration?: number | string;
  targetSpeed?: number | string;
  masterWords?: number;
  typedWords?: number;
  accuracy?: number;
  errorPercentage?: number;
  wpm?: number;
  wrongWords?: string[] | string;
  missingWords?: string[] | string;
  extraWords?: string[] | string;
  spellingMistakes?: number;
  punctuationMistakes?: number;
  fullMistakes?: number;
  halfMistakes?: number;
  totalMistakes?: number;
  timeTaken?: number | string;
  createdAt?: any;
};

function getDate(value: any): Date | null {
  if (!value) return null;

  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
        ? value
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function dateKey(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: any): string {
  const date = getDate(value);
  if (!date) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayValue(value: any, suffix = ""): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  return `${value}${suffix}`;
}

function formatTime(value: any): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  if (typeof value === "string") return value;

  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return String(value);

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} min ${remainingSeconds} sec`;
  }

  return `${Math.round(seconds)} sec`;
}

function getWordList(value: string[] | string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return value
    .split(/[,;\n]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  gradient: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/80 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ background: gradient }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-2xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <p className="mt-1 break-words text-lg font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MistakeCard({
  title,
  words,
  color,
}: {
  title: string;
  words: string[];
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-bold text-slate-800">{title}</h4>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-700">
          {words.length}
        </span>
      </div>

      {words.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="rounded-lg bg-white/80 px-2.5 py-1 text-sm text-slate-800"
            >
              {word}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No words recorded.</p>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-words text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  const [filterExam, setFilterExam] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;

      setUser(currentUser);

      if (!currentUser) {
        router.replace("/");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const testsRef = collection(
          db,
          "users",
          currentUser.uid,
          "tests"
        );

        let snapshot;

        try {
          snapshot = await getDocs(
            query(testsRef, orderBy("createdAt", "desc"))
          );
        } catch {
          // Fallback for older test documents without createdAt.
          snapshot = await getDocs(testsRef);
        }

        if (cancelled) return;

        const loadedTests: TestResult[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<TestResult, "id">),
        }));

        loadedTests.sort((a, b) => {
          const dateA = getDate(a.createdAt)?.getTime() ?? 0;
          const dateB = getDate(b.createdAt)?.getTime() ?? 0;
          return dateB - dateA;
        });

        setTests(loadedTests);
      } catch (err) {
        console.error("Failed to load test results:", err);
        if (!cancelled) {
          setError(
            "Test results could not be loaded. Please check your internet connection and Firebase permissions."
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

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesExam =
        filterExam === "All" ||
        (test.exam || "").toLowerCase() === filterExam.toLowerCase();

      const testDate = getDate(test.createdAt);
      const key = dateKey(testDate);

      const matchesStart = !startDate || (key !== "" && key >= startDate);
      const matchesEnd = !endDate || (key !== "" && key <= endDate);

      return matchesExam && matchesStart && matchesEnd;
    });
  }, [tests, filterExam, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredTests.length;

    const accuracyValues = filteredTests
      .map((test) => Number(test.accuracy))
      .filter(Number.isFinite);

    const speedValues = filteredTests
      .map((test) => Number(test.wpm))
      .filter(Number.isFinite);

    const averageAccuracy =
      accuracyValues.length > 0
        ? accuracyValues.reduce((sum, value) => sum + value, 0) /
          accuracyValues.length
        : 0;

    const averageSpeed =
      speedValues.length > 0
        ? speedValues.reduce((sum, value) => sum + value, 0) /
          speedValues.length
        : 0;

    const totalMistakes = filteredTests.reduce(
      (sum, test) => sum + (Number(test.totalMistakes) || 0),
      0
    );

    return {
      total,
      averageAccuracy,
      averageSpeed,
      totalMistakes,
    };
  }, [filteredTests]);

  const resetFilters = () => {
    setFilterExam("All");
    setStartDate("");
    setEndDate("");
  };

  const selectedWrongWords = selectedTest
    ? getWordList(selectedTest.wrongWords)
    : [];

  const selectedMissingWords = selectedTest
    ? getWordList(selectedTest.missingWords)
    : [];

  const selectedExtraWords = selectedTest
    ? getWordList(selectedTest.extraWords)
    : [];

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-6"
        style={{
          background:
            "linear-gradient(135deg, #fff1f2 0%, #fef3c7 22%, #dcfce7 45%, #dbeafe 68%, #f3e8ff 85%, #fce7f3 100%)",
        }}
      >
        <div className="rounded-3xl border border-white bg-white/80 px-8 py-7 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="font-semibold text-slate-700">
            Loading your test results...
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        background:
          "linear-gradient(135deg, #fff1f2 0%, #fef3c7 20%, #dcfce7 40%, #dbeafe 60%, #ede9fe 80%, #fce7f3 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-3 rounded-full border border-white bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
              My Test Results
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Review your previous tests, accuracy, speed and mistakes.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-white bg-white/75 p-3 shadow-sm sm:self-auto">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 text-lg font-bold text-slate-800">
                {(user.displayName || user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-48 truncate text-sm font-bold text-slate-800">
                {user.displayName || "Student"}
              </p>
              <p className="max-w-48 truncate text-xs text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Tests Attempted"
            value={stats.total}
            subtitle="Tests matching your filters"
            icon="📝"
            gradient="linear-gradient(135deg, #ffe4e6, #fff1f2)"
          />
          <SummaryCard
            title="Average Accuracy"
            value={`${stats.averageAccuracy.toFixed(1)}%`}
            subtitle="Across available accuracy records"
            icon="🎯"
            gradient="linear-gradient(135deg, #dbeafe, #eff6ff)"
          />
          <SummaryCard
            title="Average Speed"
            value={`${stats.averageSpeed.toFixed(1)} WPM`}
            subtitle="Across available speed records"
            icon="⚡"
            gradient="linear-gradient(135deg, #fef3c7, #ffedd5)"
          />
          <SummaryCard
            title="Total Mistakes"
            value={stats.totalMistakes}
            subtitle="Across matching tests"
            icon="✍️"
            gradient="linear-gradient(135deg, #ede9fe, #fce7f3)"
          />
        </section>

        {/* Filters */}
        <section className="mb-7 rounded-3xl border border-white/90 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-800">
              Filter Your Results
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose an exam or date range to find a particular attempt.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Examination
              </span>
              <select
                value={filterExam}
                onChange={(event) => setFilterExam(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              >
                <option value="All">All Exams</option>
                <option value="SSC Stenographer">SSC Stenographer</option>
                <option value="DSSSB">DSSSB</option>
                <option value="DHC">Delhi High Court (DHC)</option>
                <option value="AHC">Allahabad High Court (AHC)</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                From Date
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                To Date
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </label>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 text-sm font-bold text-purple-700 transition hover:from-purple-100 hover:to-pink-100"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredTests.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">{tests.length}</span>{" "}
            saved tests.
          </p>
        </section>

        {/* Test history */}
        <section className="overflow-hidden rounded-3xl border border-white/90 bg-white/85 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Test History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a test to view its detailed result.
              </p>
            </div>
            <span className="w-fit rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 px-4 py-2 text-sm font-bold text-slate-700">
              {filteredTests.length} Results
            </span>
          </div>

          {filteredTests.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 text-3xl">
                📋
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No tests found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are no saved tests matching these filters. Try changing
                the examination or date range.
              </p>
              <button
                onClick={resetFilters}
                className="mt-5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50">
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Date
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Examination
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Accuracy
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Speed
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Mistakes
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map((test, index) => (
                    <tr
                      key={test.id}
                      className={`border-t border-slate-100 transition hover:bg-purple-50/60 ${
                        index % 2 === 0 ? "bg-white/50" : "bg-slate-50/40"
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(test.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                          {test.exam || "Exam not specified"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-emerald-700">
                          {displayValue(test.accuracy, "%")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {displayValue(test.wpm, " WPM")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-9 justify-center rounded-full bg-rose-100 px-3 py-1.5 text-sm font-bold text-rose-700">
                          {test.totalMistakes ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedTest(test)}
                          className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="py-7 text-center text-xs text-slate-500">
          Your saved test history is loaded from your StenoCheck account.
        </footer>
      </div>

      {/* Test detail modal */}
      {selectedTest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelectedTest(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-detail-title"
            className="my-auto max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/70 p-5 sm:p-6"
              style={{
                background:
                  "linear-gradient(110deg, #ffe4e6 0%, #fef3c7 25%, #dcfce7 50%, #dbeafe 75%, #f3e8ff 100%)",
              }}
            >
              <div>
                <h2
                  id="test-detail-title"
                  className="text-xl font-extrabold text-slate-800 sm:text-2xl"
                >
                  Test Details
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedTest.exam || "Examination not specified"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(selectedTest.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedTest(null)}
                aria-label="Close test details"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-xl font-bold text-slate-700 transition hover:bg-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-6">
              {/* Performance overview */}
              <section>
                <h3 className="mb-4 text-lg font-bold text-slate-800">
                  Performance Overview
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <DetailCard
                    title="Accuracy"
                    value={displayValue(selectedTest.accuracy, "%")}
                    color="border-emerald-200 bg-emerald-50"
                  />
                  <DetailCard
                    title="Error Percentage"
                    value={displayValue(selectedTest.errorPercentage, "%")}
                    color="border-rose-200 bg-rose-50"
                  />
                  <DetailCard
                    title="Typing Speed"
                    value={displayValue(selectedTest.wpm, " WPM")}
                    color="border-blue-200 bg-blue-50"
                  />
                  <DetailCard
                    title="Total Mistakes"
                    value={selectedTest.totalMistakes ?? 0}
                    color="border-orange-200 bg-orange-50"
                  />
                  <DetailCard
                    title="Wrong Words"
                    value={selectedWrongWords.length}
                    color="border-red-200 bg-red-50"
                  />
                  <DetailCard
                    title="Missing Words"
                    value={selectedMissingWords.length}
                    color="border-amber-200 bg-amber-50"
                  />
                </div>
              </section>

              {/* Mistake breakdown */}
              <section>
                <h3 className="mb-4 text-lg font-bold text-slate-800">
                  Mistake Breakdown
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <MistakeCard
                    title="Wrong Words"
                    words={selectedWrongWords}
                    color="border-red-200 bg-red-50"
                  />
                  <MistakeCard
                    title="Missing Words"
                    words={selectedMissingWords}
                    color="border-amber-200 bg-amber-50"
                  />
                  <MistakeCard
                    title="Extra Words"
                    words={selectedExtraWords}
                    color="border-purple-200 bg-purple-50"
                  />

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-3 font-bold text-slate-800">
                      Other Mistakes
                    </h4>
                    <InfoRow
                      label="Spelling Mistakes"
                      value={selectedTest.spellingMistakes ?? 0}
                    />
                    <InfoRow
                      label="Punctuation Mistakes"
                      value={selectedTest.punctuationMistakes ?? 0}
                    />
                    <InfoRow
                      label="Full Mistakes"
                      value={selectedTest.fullMistakes ?? 0}
                    />
                    <InfoRow
                      label="Half Mistakes"
                      value={selectedTest.halfMistakes ?? 0}
                    />
                  </div>
                </div>
              </section>

              {/* Test information */}
              <section>
                <h3 className="mb-3 text-lg font-bold text-slate-800">
                  Test Information
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4">
                  <InfoRow
                    label="Examination"
                    value={selectedTest.exam || "—"}
                  />
                  <InfoRow
                    label="Dictation Duration"
                    value={formatTime(selectedTest.duration)}
                  />
                  <InfoRow
                    label="Target Speed"
                    value={displayValue(selectedTest.targetSpeed, " WPM")}
                  />
                  <InfoRow
                    label="Time Taken"
                    value={formatTime(selectedTest.timeTaken)}
                  />
                  <InfoRow
                    label="Master Passage Words"
                    value={selectedTest.masterWords ?? 0}
                  />
                  <InfoRow
                    label="Typed Words"
                    value={selectedTest.typedWords ?? 0}
                  />
                  <InfoRow
                    label="Test Date"
                    value={formatDate(selectedTest.createdAt)}
                  />
                </div>
              </section>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => setSelectedTest(null)}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
