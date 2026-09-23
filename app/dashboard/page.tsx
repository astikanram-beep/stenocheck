"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

import { auth, db } from "../../lib/firebase";

type TestResult = {
  id: string;
  exam?: string;
  duration?: number;
  targetSpeed?: number;
  masterWords?: number;
  typedWords?: number;
  accuracy?: number;
  errorPercentage?: number;
  wpm?: number;
  totalMistakes?: number;
  fullMistakes?: number;
  halfMistakes?: number;
  createdAt?: any;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<TestResult[]>([]);

  const [stats, setStats] = useState({
    testsAttempted: 0,
    averageAccuracy: 0,
    averageSpeed: 0,
    totalMistakes: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          window.location.href = "/";
          return;
        }

        setUser(currentUser);

        try {
          const testsRef = collection(
            db,
            "users",
            currentUser.uid,
            "tests"
          );

          const testsQuery = query(
            testsRef,
            orderBy("createdAt", "desc"),
            limit(20)
          );

          const snapshot = await getDocs(testsQuery);

          const loadedTests: TestResult[] =
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as TestResult[];

          setTests(loadedTests);

          const totalTests = loadedTests.length;

          if (totalTests > 0) {
            const totalAccuracy =
              loadedTests.reduce(
                (sum, test) =>
                  sum + Number(test.accuracy || 0),
                0
              );

            const totalSpeed =
              loadedTests.reduce(
                (sum, test) =>
                  sum + Number(test.wpm || 0),
                0
              );

            const totalMistakes =
              loadedTests.reduce(
                (sum, test) =>
                  sum +
                  Number(test.totalMistakes || 0),
                0
              );

            setStats({
              testsAttempted: totalTests,
              averageAccuracy:
                totalAccuracy / totalTests,
              averageSpeed:
                totalSpeed / totalTests,
              totalMistakes,
            });
          } else {
            setStats({
              testsAttempted: 0,
              averageAccuracy: 0,
              averageSpeed: 0,
              totalMistakes: 0,
            });
          }
        } catch (error) {
          console.error(
            "Error loading dashboard:",
            error
          );
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function logout() {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) {
      return "—";
    }

    try {
      const date =
        timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "—";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* ================= HEADER ================= */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              StenoCheck
            </h1>

            <p className="text-sm text-slate-500">
              Stenography Practice & Analysis
            </p>
          </div>

          <div className="flex items-center gap-4">

            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {(user?.displayName ||
                  user?.email ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Logout
            </button>

          </div>
        </div>
      </header>


      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* WELCOME */}

        <div>
          <h2 className="text-3xl font-bold">
            Welcome,{" "}
            {user?.displayName ||
              "User"}{" "}
            👋
          </h2>

          <p className="mt-2 text-slate-500">
            Track your stenography practice
            and improve your performance.
          </p>
        </div>


        {/* ================= STATS ================= */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Tests Attempted"
            value={stats.testsAttempted.toString()}
            icon="📝"
          />

          <StatCard
            title="Average Accuracy"
            value={
              stats.testsAttempted > 0
                ? `${stats.averageAccuracy.toFixed(
                    1
                  )}%`
                : "—"
            }
            icon="🎯"
          />

          <StatCard
            title="Average Speed"
            value={
              stats.testsAttempted > 0
                ? `${stats.averageSpeed.toFixed(
                    1
                  )} WPM`
                : "—"
            }
            icon="⚡"
          />

          <StatCard
            title="Total Mistakes"
            value={stats.totalMistakes.toString()}
            icon="❌"
          />

        </div>


        {/* ================= OPTIONS ================= */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          {/* NEW TEST */}

          <button
            onClick={() => {
              window.location.href =
                "/checker";
            }}
            className="rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >

            <div className="text-3xl">
              📝
            </div>

            <h3 className="mt-4 text-lg font-bold">
              New Dictation Test
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Start a new stenography passage
              checking test.
            </p>

            <span className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
              Start Test
            </span>

          </button>


          {/* RESULTS */}

          <a
            href="/results"
            className="block cursor-pointer rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="text-3xl">
              📊
            </div>

            <h3 className="mt-4 text-lg font-bold">
              My Test Results
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View all your previous
              dictation tests and results.
            </p>

            <span className="mt-5 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              View Results
            </span>

          </a>


          {/* MISTAKES */}

          <a
            href="/mistakes"
            className="block cursor-pointer rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <div className="text-3xl">
              ❌
            </div>

            <h3 className="mt-4 text-lg font-bold">
              My Mistakes
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Review your repeated spelling,
              missing and wrong-word mistakes.
            </p>

            <span className="mt-5 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              View Mistakes
            </span>

          </a>

        </div>


        {/* ================= RECENT TESTS ================= */}

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="text-xl font-bold">
                Recent Tests
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your latest saved dictation
                tests.
              </p>
            </div>

            {tests.length > 0 && (
              <a
                href="/results"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                View All
              </a>
            )}

          </div>


          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[800px] text-left">

              <thead>

                <tr className="border-b text-sm text-slate-500">

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Exam
                  </th>

                  <th className="px-4 py-3">
                    Words
                  </th>

                  <th className="px-4 py-3">
                    Accuracy
                  </th>

                  <th className="px-4 py-3">
                    Speed
                  </th>

                  <th className="px-4 py-3">
                    Mistakes
                  </th>

                </tr>

              </thead>


              <tbody>

                {tests.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center"
                    >

                      <div className="text-4xl">
                        📝
                      </div>

                      <p className="mt-3 font-semibold text-slate-700">
                        No tests attempted yet
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Complete your first
                        dictation test to see
                        your results here.
                      </p>

                    </td>

                  </tr>

                ) : (

                  tests.map((test) => (

                    <tr
                      key={test.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(
                          test.createdAt
                        )}
                      </td>

                      <td className="px-4 py-4">

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {test.exam ||
                            "—"}
                        </span>

                      </td>

                      <td className="px-4 py-4 font-medium">
                        {test.typedWords ||
                          0}
                      </td>

                      <td className="px-4 py-4">

                        <span
                          className={
                            Number(
                              test.accuracy ||
                                0
                            ) >= 95
                              ? "font-bold text-emerald-600"
                              : Number(
                                    test.accuracy ||
                                      0
                                  ) >= 80
                                ? "font-bold text-yellow-600"
                                : "font-bold text-red-600"
                          }
                        >
                          {Number(
                            test.accuracy ||
                              0
                          ).toFixed(1)}
                          %
                        </span>

                      </td>

                      <td className="px-4 py-4 font-medium">
                        {test.wpm || 0} WPM
                      </td>

                      <td className="px-4 py-4">

                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                          {test.totalMistakes ||
                            0}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>

    </main>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <span className="text-2xl">
          {icon}
        </span>

      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}