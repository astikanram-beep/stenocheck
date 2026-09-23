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
  exam?: string;
  duration?: number;
  targetSpeed?: number;

  masterWords?: number;
  typedWords?: number;

  accuracy?: number;
  errorPercentage?: number;

  wpm?: number;

  wrongWords?: number;
  missingWords?: number;
  extraWords?: number;
  spellingMistakes?: number;
  punctuationMistakes?: number;

  fullMistakes?: number;
  halfMistakes?: number;
  totalMistakes?: number;

  timeTaken?: number;

  createdAt?: any;
};

export default function ResultsPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] =
    useState<TestResult | null>(null);

  const [filterExam, setFilterExam] =
    useState("All");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          window.location.href = "/";
          return;
        }

        try {
          const testsRef = collection(
            db,
            "users",
            user.uid,
            "tests"
          );

          const testsQuery = query(
            testsRef,
            orderBy("createdAt", "desc")
          );

          const snapshot =
            await getDocs(testsQuery);

          const loadedTests =
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as TestResult[];

          setTests(loadedTests);
        } catch (error) {
          console.error(
            "Error loading results:",
            error
          );
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredTests =
    filterExam === "All"
      ? tests
      : tests.filter(
          (test) =>
            test.exam === filterExam
        );

  function formatDate(timestamp: any) {
    if (!timestamp) return "—";

    try {
      const date =
        timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  function formatTime(seconds = 0) {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining =
      seconds % 60;

    return `${minutes}:${String(
      remaining
    ).padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your results...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              StenoCheck
            </h1>

            <p className="text-sm text-slate-500">
              My Test Results
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href =
                "/dashboard";
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            ← Dashboard
          </button>

        </div>
      </header>


      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div>
          <h2 className="text-3xl font-bold">
            My Test Results
          </h2>

          <p className="mt-2 text-slate-500">
            View all your saved stenography
            practice tests.
          </p>
        </div>


        {/* FILTER */}

        <div className="mt-7 rounded-2xl border bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-semibold">
                Filter by Examination
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Select an exam to see only
                those tests.
              </p>
            </div>

            <select
              value={filterExam}
              onChange={(e) =>
                setFilterExam(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">
                All Examinations
              </option>

              <option value="SSC Stenographer">
                SSC Stenographer
              </option>

              <option value="DSSSB">
                DSSSB
              </option>

              <option value="DHC">
                DHC
              </option>

              <option value="AHC">
                AHC
              </option>
            </select>

          </div>

        </div>


        {/* SUMMARY */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <SummaryCard
            title="Total Tests"
            value={filteredTests.length.toString()}
          />

          <SummaryCard
            title="Average Accuracy"
            value={
              filteredTests.length
                ? `${(
                    filteredTests.reduce(
                      (sum, test) =>
                        sum +
                        Number(
                          test.accuracy ||
                            0
                        ),
                      0
                    ) /
                    filteredTests.length
                  ).toFixed(1)}%`
                : "—"
            }
          />

          <SummaryCard
            title="Average Speed"
            value={
              filteredTests.length
                ? `${(
                    filteredTests.reduce(
                      (sum, test) =>
                        sum +
                        Number(
                          test.wpm || 0
                        ),
                      0
                    ) /
                    filteredTests.length
                  ).toFixed(1)} WPM`
                : "—"
            }
          />

        </div>


        {/* RESULTS TABLE */}

        <div className="mt-6 rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <h3 className="text-xl font-bold">
              Test History
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Click any test to view its
              detailed breakdown.
            </p>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>

                <tr className="border-b bg-slate-50 text-sm text-slate-500">

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Exam
                  </th>

                  <th className="px-5 py-4">
                    Time
                  </th>

                  <th className="px-5 py-4">
                    Target
                  </th>

                  <th className="px-5 py-4">
                    WPM
                  </th>

                  <th className="px-5 py-4">
                    Accuracy
                  </th>

                  <th className="px-5 py-4">
                    Mistakes
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredTests.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >

                      <div className="text-5xl">
                        📝
                      </div>

                      <p className="mt-4 font-semibold text-slate-700">
                        No tests found
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Complete a dictation test
                        to create your history.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredTests.map(
                    (test) => (
                      <tr
                        key={test.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            test.createdAt
                          )}
                        </td>


                        <td className="px-5 py-4">

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {test.exam ||
                              "—"}
                          </span>

                        </td>


                        <td className="px-5 py-4 font-medium">
                          {test.duration || 0} min
                        </td>


                        <td className="px-5 py-4 font-medium">
                          {test.targetSpeed ||
                            0}{" "}
                          WPM
                        </td>


                        <td className="px-5 py-4 font-bold text-blue-700">
                          {test.wpm || 0}
                        </td>


                        <td className="px-5 py-4">

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


                        <td className="px-5 py-4">

                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            {test.totalMistakes ||
                              0}
                          </span>

                        </td>


                        <td className="px-5 py-4">

                          <button
                            onClick={() =>
                              setSelectedTest(
                                test
                              )
                            }
                            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            View
                          </button>

                        </td>

                      </tr>
                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>


      {/* DETAIL MODAL */}

      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <p className="text-sm font-semibold text-blue-600">
                  {selectedTest.exam}
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  Test Details
                </h3>
              </div>

              <button
                onClick={() =>
                  setSelectedTest(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg hover:bg-slate-200"
              >
                ×
              </button>

            </div>


            {/* STATS */}

            <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">

              <DetailCard
                title="Accuracy"
                value={`${Number(
                  selectedTest.accuracy ||
                    0
                ).toFixed(1)}%`}
              />

              <DetailCard
                title="Error"
                value={`${Number(
                  selectedTest.errorPercentage ||
                    0
                ).toFixed(1)}%`}
              />

              <DetailCard
                title="WPM"
                value={`${selectedTest.wpm || 0}`}
              />

              <DetailCard
                title="Time Taken"
                value={formatTime(
                  selectedTest.timeTaken
                )}
              />

            </div>


            {/* MISTAKES */}

            <div className="px-6 pb-6">

              <h4 className="text-lg font-bold">
                Mistake Breakdown
              </h4>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <MistakeCard
                  title="Wrong Words"
                  value={
                    selectedTest.wrongWords
                  }
                  className="bg-red-50 text-red-700"
                />

                <MistakeCard
                  title="Missing Words"
                  value={
                    selectedTest.missingWords
                  }
                  className="bg-yellow-50 text-yellow-800"
                />

                <MistakeCard
                  title="Extra Words"
                  value={
                    selectedTest.extraWords
                  }
                  className="bg-orange-50 text-orange-700"
                />

                <MistakeCard
                  title="Spelling Mistakes"
                  value={
                    selectedTest.spellingMistakes
                  }
                  className="bg-purple-50 text-purple-700"
                />

                <MistakeCard
                  title="Comma / Punctuation"
                  value={
                    selectedTest.punctuationMistakes
                  }
                  className="bg-blue-50 text-blue-700"
                />

                <MistakeCard
                  title="Full Mistakes"
                  value={
                    selectedTest.fullMistakes
                  }
                  className="bg-red-50 text-red-700"
                />

                <MistakeCard
                  title="Half Mistakes"
                  value={
                    selectedTest.halfMistakes
                  }
                  className="bg-yellow-50 text-yellow-800"
                />

                <MistakeCard
                  title="Total Mistakes"
                  value={
                    selectedTest.totalMistakes
                  }
                  className="bg-slate-100 text-slate-800"
                />

              </div>


              {/* TEST INFO */}

              <div className="mt-6 rounded-xl bg-slate-50 p-5">

                <h4 className="font-bold">
                  Test Information
                </h4>

                <div className="mt-4 space-y-3">

                  <InfoRow
                    label="Examination"
                    value={
                      selectedTest.exam ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Dictation Time"
                    value={`${selectedTest.duration || 0} minutes`}
                  />

                  <InfoRow
                    label="Target Speed"
                    value={`${selectedTest.targetSpeed || 0} WPM`}
                  />

                  <InfoRow
                    label="Master Words"
                    value={`${selectedTest.masterWords || 0}`}
                  />

                  <InfoRow
                    label="Typed Words"
                    value={`${selectedTest.typedWords || 0}`}
                  />

                  <InfoRow
                    label="Date"
                    value={formatDate(
                      selectedTest.createdAt
                    )}
                  />

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}


function DetailCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">

      <p className="text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>

    </div>
  );
}


function MistakeCard({
  title,
  value,
  className,
}: {
  title: string;
  value?: number;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ${className}`}
    >

      <span className="text-sm font-medium">
        {title}
      </span>

      <span className="text-lg font-bold">
        {value || 0}
      </span>

    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-800">
        {value}
      </span>

    </div>
  );
}