"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Screen =
  | "start"
  | "passage"
  | "exam"
  | "settings"
  | "typing"
  | "result";

type ExamType =
  | "SSC Stenographer"
  | "DSSSB"
  | "DHC"
  | "AHC";

type MistakeType =
  | "wrong"
  | "missing"
  | "extra"
  | "spelling"
  | "punctuation";

type HighlightItem = {
  type: MistakeType | "correct";
  word: string;
  correctWord?: string;
  index: number;
};

type AnalysisResult = {
  masterWords: number;
  typedWords: number;

  wrongWords: number;
  missingWords: number;
  extraWords: number;

  spellingMistakes: number;
  punctuationMistakes: number;

  fullMistakes: number;
  halfMistakes: number;

  totalMistakes: number;

  accuracy: number;
  errorPercentage: number;

  wpm: number;
  timeTaken: number;

  highlights: HighlightItem[];
};

const speedOptions = [
  70,
  80,
  90,
  100,
  110,
  120,
  130,
  140,
  150,
  160,
];

const examOptions: ExamType[] = [
  "SSC Stenographer",
  "DSSSB",
  "DHC",
  "AHC",
];

const timeOptions = [30, 40, 50];

const emptyResult: AnalysisResult = {
  masterWords: 0,
  typedWords: 0,

  wrongWords: 0,
  missingWords: 0,
  extraWords: 0,

  spellingMistakes: 0,
  punctuationMistakes: 0,

  fullMistakes: 0,
  halfMistakes: 0,

  totalMistakes: 0,

  accuracy: 0,
  errorPercentage: 0,

  wpm: 0,
  timeTaken: 0,

  highlights: [],
};

export default function CheckerPage() {
  const [screen, setScreen] = useState<Screen>("start");

  const [masterPassage, setMasterPassage] = useState("");
  const [typedPassage, setTypedPassage] = useState("");

  const [exam, setExam] = useState<ExamType | "">("");

  const [duration, setDuration] = useState<number>(50);
  const [speed, setSpeed] = useState<number>(100);

  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const [result, setResult] =
    useState<AnalysisResult>(emptyResult);

  const [saving, setSaving] = useState(false);

  const masterWords = useMemo(
    () => getWords(masterPassage).length,
    [masterPassage]
  );

  const typedWords = useMemo(
    () => getWords(typedPassage).length,
    [typedPassage]
  );

  /*
   * TIMER
   */
  useEffect(() => {
    if (screen !== "typing") return;
    if (timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);

          setTimeout(() => {
            finishTest();
          }, 0);

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, timeLeft]);

  function startTest() {
    if (!masterPassage.trim()) return;
    if (!exam) return;

    setTypedPassage("");
    setTimeLeft(duration * 60);
    setStartedAt(Date.now());
    setScreen("typing");
  }

  async function finishTest() {
    if (saving) return;

    const master = getWords(masterPassage);
    const typed = getWords(typedPassage);

    const analysis = analyzePassages(
      master,
      typed,
      exam as ExamType
    );

    const endTime = Date.now();

    const elapsedSeconds = startedAt
      ? Math.max(
          1,
          Math.min(
            duration * 60,
            Math.floor(
              (endTime - startedAt) / 1000
            )
          )
        )
      : 1;

    const elapsedMinutes = elapsedSeconds / 60;

    const calculatedWpm =
      elapsedMinutes > 0
        ? Math.round(
            typed.length / elapsedMinutes
          )
        : 0;

    /*
     * Accuracy is based on actual mistake count.
     *
     * Full mistake = 1
     * Half mistake = 0.5
     *
     * This prevents a passage with mistakes
     * from incorrectly showing 100% accuracy.
     */
    const weightedMistakes =
      analysis.fullMistakes +
      analysis.halfMistakes * 0.5;

    const accuracy =
      master.length > 0
        ? Math.max(
            0,
            Math.min(
              100,
              100 -
                (weightedMistakes /
                  master.length) *
                  100
            )
          )
        : 0;

    const errorPercentage =
      Math.max(0, 100 - accuracy);

    const finalResult: AnalysisResult = {
      ...analysis,
      masterWords: master.length,
      typedWords: typed.length,
      accuracy,
      errorPercentage,
      wpm: calculatedWpm,
      timeTaken: elapsedSeconds,
    };

    setResult(finalResult);

    /*
     * SAVE TEST TO FIREBASE
     */
    const currentUser = auth.currentUser;

    if (currentUser) {
      setSaving(true);

      try {
        await addDoc(
          collection(
            db,
            "users",
            currentUser.uid,
            "tests"
          ),
          {
            exam: exam,
            duration: duration,
            targetSpeed: speed,

            masterPassage: masterPassage,
            typedPassage: typedPassage,

            masterWords: master.length,
            typedWords: typed.length,

            wrongWords:
              analysis.wrongWords,

            missingWords:
              analysis.missingWords,

            extraWords:
              analysis.extraWords,

            spellingMistakes:
              analysis.spellingMistakes,

            punctuationMistakes:
              analysis.punctuationMistakes,

            fullMistakes:
              analysis.fullMistakes,

            halfMistakes:
              analysis.halfMistakes,

            totalMistakes:
              analysis.totalMistakes,

            accuracy: accuracy,
            errorPercentage:
              errorPercentage,

            wpm: calculatedWpm,

            timeTaken: elapsedSeconds,

            createdAt:
              serverTimestamp(),
          }
        );

        console.log(
          "Test saved successfully"
        );
      } catch (error) {
        console.error(
          "Error saving test:",
          error
        );
      } finally {
        setSaving(false);
      }
    }

    setScreen("result");
  }

  function resetTest() {
    setScreen("start");

    setMasterPassage("");
    setTypedPassage("");

    setExam("");

    setDuration(50);
    setSpeed(100);

    setTimeLeft(0);
    setStartedAt(null);

    setResult(emptyResult);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              StenoCheck
            </h1>

            <p className="text-sm text-slate-500">
              Stenography Practice & Analysis
            </p>
          </div>

          {screen !== "start" && (
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {exam || "Dictation Test"}
            </div>
          )}

        </div>
      </header>

      {/* START */}
      {screen === "start" && (
        <StartScreen
          onStart={() =>
            setScreen("passage")
          }
        />
      )}

      {/* PASSAGE */}
      {screen === "passage" && (
        <PassageScreen
          masterPassage={masterPassage}
          setMasterPassage={
            setMasterPassage
          }
          wordCount={masterWords}
          onBack={() =>
            setScreen("start")
          }
          onContinue={() => {
            if (masterPassage.trim()) {
              setScreen("exam");
            }
          }}
        />
      )}

      {/* EXAM */}
      {screen === "exam" && (
        <ExamScreen
          exam={exam}
          setExam={setExam}
          onBack={() =>
            setScreen("passage")
          }
          onContinue={() => {
            if (exam) {
              setScreen("settings");
            }
          }}
        />
      )}

      {/* SETTINGS */}
      {screen === "settings" && (
        <SettingsScreen
          exam={exam}
          duration={duration}
          setDuration={setDuration}
          speed={speed}
          setSpeed={setSpeed}
          onBack={() =>
            setScreen("exam")
          }
          onStart={startTest}
        />
      )}

      {/* TYPING */}
      {screen === "typing" && (
        <TypingScreen
          exam={exam}
          duration={duration}
          speed={speed}
          timeLeft={timeLeft}
          typedPassage={typedPassage}
          setTypedPassage={
            setTypedPassage
          }
          onSubmit={finishTest}
        />
      )}

      {/* RESULT */}
      {screen === "result" && (
        <ResultScreen
          result={result}
          masterPassage={masterPassage}
          typedPassage={typedPassage}
          saving={saving}
          onNewTest={resetTest}
        />
      )}

    </main>
  );
}


/* =========================================================
   START SCREEN
========================================================= */

function StartScreen({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-90px)] max-w-5xl items-center justify-center px-6 py-12">

      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-4xl">
          📝
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Steno Practice
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          Check Your Own Passage
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-slate-500">
          Paste your own original passage,
          select your examination and test
          settings, then check your
          transcription with detailed
          mistake analysis.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-8 rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white transition hover:bg-blue-700"
        >
          Start →
        </button>

      </div>
    </section>
  );
}


/* =========================================================
   PASSAGE SCREEN
========================================================= */

function PassageScreen({
  masterPassage,
  setMasterPassage,
  wordCount,
  onBack,
  onContinue,
}: {
  masterPassage: string;
  setMasterPassage: (
    value: string
  ) => void;
  wordCount: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">

      <StepHeader
        step="1"
        title="Paste Your Master Passage"
        description="Paste the original correct passage. It will remain hidden during the typing test."
      />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-lg font-bold">
              Master Passage
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Paste the complete original
              passage here.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {wordCount} words
          </span>

        </div>

        <textarea
          value={masterPassage}
          onChange={(e) =>
            setMasterPassage(
              e.target.value
            )
          }
          placeholder="Paste your master passage here..."
          className="mt-5 h-80 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-5 text-base leading-7 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 px-6 py-3 font-semibold hover:bg-slate-50"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={!masterPassage.trim()}
            className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>

        </div>
      </div>
    </section>
  );
}


/* =========================================================
   EXAM SCREEN
========================================================= */

function ExamScreen({
  exam,
  setExam,
  onBack,
  onContinue,
}: {
  exam: ExamType | "";
  setExam: (
    value: ExamType
  ) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">

      <StepHeader
        step="2"
        title="Select Exam Type"
        description="Click the exam box and select the examination you want to use."
      />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <label className="text-sm font-semibold text-slate-700">
          Examination
        </label>

        <select
          value={exam}
          onChange={(e) =>
            setExam(
              e.target.value as ExamType
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">
            Click to search/select exam
          </option>

          {examOptions.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {exam && (
          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            Selected examination:
            <strong className="ml-1">
              {exam}
            </strong>
          </div>
        )}

      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-6 py-3 font-semibold hover:bg-white"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={!exam}
          className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue →
        </button>

      </div>
    </section>
  );
}


/* =========================================================
   SETTINGS
========================================================= */

function SettingsScreen({
  exam,
  duration,
  setDuration,
  speed,
  setSpeed,
  onBack,
  onStart,
}: {
  exam: ExamType | "";
  duration: number;
  setDuration: (
    value: number
  ) => void;
  speed: number;
  setSpeed: (
    value: number
  ) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">

      <StepHeader
        step="3"
        title={`${exam} Settings`}
        description="Click each selection box to choose your test time and dictation speed."
      />

      <div className="mt-8 space-y-6">

        {/* MISTAKES */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="text-xl font-bold">
            Mistakes to Calculate
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            The system will calculate the
            relevant mistakes for the selected
            examination.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <RuleBox
              title="Wrong Word"
              text="Word differs from the master passage"
              color="red"
            />

            <RuleBox
              title="Missing Word"
              text="Master word is omitted"
              color="yellow"
            />

            <RuleBox
              title="Extra Word"
              text="Additional word is typed"
              color="orange"
            />

            <RuleBox
              title="Spelling"
              text="Small spelling variation"
              color="purple"
            />

            {(exam === "DHC" ||
              exam === "AHC") && (
              <RuleBox
                title="Comma / Punctuation"
                text="Comma and punctuation differences are checked"
                color="blue"
              />
            )}

            <RuleBox
              title="Full / Half"
              text="Mistakes are converted into full and half mistake counts"
              color="slate"
            />

          </div>
        </div>


        {/* TIME */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="text-xl font-bold">
            Dictation Time
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Click the box and choose the
            required test duration.
          </p>

          <select
            value={duration}
            onChange={(e) =>
              setDuration(
                Number(e.target.value)
              )
            }
            className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {timeOptions.map((value) => (
              <option
                key={value}
                value={value}
              >
                {value} minutes
              </option>
            ))}
          </select>

        </div>


        {/* SPEED */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="text-xl font-bold">
            Dictation Speed
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Click the box and choose your
            target speed.
          </p>

          <select
            value={speed}
            onChange={(e) =>
              setSpeed(
                Number(e.target.value)
              )
            }
            className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {speedOptions.map((value) => (
              <option
                key={value}
                value={value}
              >
                {value} WPM
              </option>
            ))}
          </select>

        </div>

      </div>


      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-6 py-3 font-semibold hover:bg-white"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Start Test →
        </button>

      </div>

    </section>
  );
}


/* =========================================================
   TYPING SCREEN
========================================================= */

function TypingScreen({
  exam,
  duration,
  speed,
  timeLeft,
  typedPassage,
  setTypedPassage,
  onSubmit,
}: {
  exam: ExamType | "";
  duration: number;
  speed: number;
  timeLeft: number;
  typedPassage: string;
  setTypedPassage: (
    value: string
  ) => void;
  onSubmit: () => void;
}) {
  const minutes =
    Math.floor(timeLeft / 60);

  const seconds =
    timeLeft % 60;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-blue-600">
              {exam}
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Dictation Test
            </h2>
          </div>

          <div className="flex gap-3">

            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">
                Target Speed
              </p>

              <p className="font-bold">
                {speed} WPM
              </p>
            </div>

            <div
              className={`rounded-xl px-5 py-3 text-center ${
                timeLeft <= 60
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <p className="text-xs opacity-70">
                Time Left
              </p>

              <p className="font-mono text-xl font-bold">
                {String(minutes).padStart(
                  2,
                  "0"
                )}
                :
                {String(seconds).padStart(
                  2,
                  "0"
                )}
              </p>
            </div>

          </div>

        </div>
      </div>


      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-4">

          <h3 className="text-lg font-bold">
            Type or Paste Your Transcription
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your master passage is hidden
            during the test.
          </p>

        </div>

        <textarea
          autoFocus
          value={typedPassage}
          onChange={(e) =>
            setTypedPassage(
              e.target.value
            )
          }
          placeholder="Start typing or paste your transcription here..."
          className="h-[55vh] min-h-[400px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-5 text-base leading-8 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-5 flex items-center justify-between">

          <p className="text-sm text-slate-500">
            {getWords(typedPassage).length} words typed
          </p>

          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Submit Test
          </button>

        </div>

      </div>
    </section>
  );
}


/* =========================================================
   RESULT
========================================================= */

function ResultScreen({
  result,
  masterPassage,
  typedPassage,
  saving,
  onNewTest,
}: {
  result: AnalysisResult;
  masterPassage: string;
  typedPassage: string;
  saving: boolean;
  onNewTest: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Test Completed
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Stenography Analysis
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review your transcription and
            mistakes below.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewTest}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold hover:bg-slate-50"
        >
          ← Try Again
        </button>

      </div>


      {/* SAVING STATUS */}
      <div className="mt-5">
        {saving ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            Saving your test...
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ Test result saved to your account
          </div>
        )}
      </div>


      {/* STATS */}

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">

        <StatBox
          title="Accuracy"
          value={`${result.accuracy.toFixed(1)}%`}
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        />

        <StatBox
          title="Error"
          value={`${result.errorPercentage.toFixed(1)}%`}
          className="border-red-200 bg-red-50 text-red-700"
        />

        <StatBox
          title="WPM"
          value={result.wpm.toString()}
          className="border-blue-200 bg-blue-50 text-blue-700"
        />

        <StatBox
          title="Full Mistakes"
          value={result.fullMistakes.toString()}
          className="border-red-200 bg-red-50 text-red-700"
        />

        <StatBox
          title="Half Mistakes"
          value={result.halfMistakes.toString()}
          className="border-yellow-200 bg-yellow-50 text-yellow-800"
        />

        <StatBox
          title="Total Mistakes"
          value={result.totalMistakes.toString()}
          className="border-purple-200 bg-purple-50 text-purple-700"
        />

        <StatBox
          title="Words Typed"
          value={result.typedWords.toString()}
          className="border-slate-200 bg-slate-50 text-slate-700"
        />

      </div>


      {/* MAIN */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">

        {/* TYPED PASSAGE */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-5 py-4">

            <div>
              <h3 className="text-xl font-bold text-blue-900">
                Your Typed Passage
              </h3>

              <p className="mt-1 text-xs text-blue-700">
                Mistakes are highlighted
                directly in your transcription
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              {result.typedWords} words
            </span>

          </div>

          <div className="p-6">

            <HighlightedPassage
              highlights={result.highlights}
            />

            {!typedPassage.trim() && (
              <p className="text-slate-400">
                No transcription entered.
              </p>
            )}

          </div>

        </div>


        {/* BREAKDOWN */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h3 className="text-xl font-bold">
            Mistake Breakdown
          </h3>

          <div className="mt-5 space-y-3">

            <BreakdownRow
              label="Wrong Words"
              value={result.wrongWords}
              className="bg-red-50 text-red-700"
              dotClass="bg-red-500"
            />

            <BreakdownRow
              label="Missing Words"
              value={result.missingWords}
              className="bg-yellow-50 text-yellow-800"
              dotClass="bg-yellow-400"
            />

            <BreakdownRow
              label="Extra Words"
              value={result.extraWords}
              className="bg-orange-50 text-orange-700"
              dotClass="bg-orange-500"
            />

            <BreakdownRow
              label="Spelling"
              value={result.spellingMistakes}
              className="bg-purple-50 text-purple-700"
              dotClass="bg-purple-500"
            />

            <BreakdownRow
              label="Comma / Punctuation"
              value={
                result.punctuationMistakes
              }
              className="bg-blue-50 text-blue-700"
              dotClass="bg-blue-500"
            />

          </div>


          <div className="my-5 border-t border-slate-200" />

          <h4 className="font-bold">
            Additional Stats
          </h4>

          <div className="mt-4 space-y-4">

            <InfoRow
              label="Time Taken"
              value={formatTime(
                result.timeTaken
              )}
            />

            <InfoRow
              label="Typing Speed"
              value={`${result.wpm} WPM`}
            />

            <InfoRow
              label="Accuracy"
              value={`${result.accuracy.toFixed(
                1
              )}%`}
            />

            <InfoRow
              label="Error Percentage"
              value={`${result.errorPercentage.toFixed(
                1
              )}%`}
            />

            <InfoRow
              label="Master Words"
              value={result.masterWords.toString()}
            />

          </div>

        </div>

      </div>


      {/* LEGEND */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <h4 className="mb-4 font-bold">
          Highlight Legend
        </h4>

        <div className="flex flex-wrap gap-x-6 gap-y-3">

          <LegendItem
            color="bg-red-300"
            label="Wrong Word"
          />

          <LegendItem
            color="bg-yellow-300"
            label="Missing Word"
          />

          <LegendItem
            color="bg-orange-300"
            label="Extra Word"
          />

          <LegendItem
            color="bg-purple-300"
            label="Spelling"
          />

          <LegendItem
            color="bg-blue-300"
            label="Comma / Punctuation"
          />

        </div>

      </div>


      {/* ACTUAL PASSAGE */}

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-white shadow-sm">

        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-4">

          <h3 className="text-xl font-bold text-emerald-900">
            Master / Actual Passage
          </h3>

          <p className="mt-1 text-xs text-emerald-700">
            Original passage used for
            comparison
          </p>

        </div>

        <div className="whitespace-pre-wrap p-6 text-base leading-8 text-slate-800">
          {masterPassage ||
            "No master passage."}
        </div>

      </div>

    </section>
  );
}


/* =========================================================
   HIGHLIGHTED PASSAGE
========================================================= */

function HighlightedPassage({
  highlights,
}: {
  highlights: HighlightItem[];
}) {
  return (
    <div className="whitespace-pre-wrap text-base leading-9 text-slate-900">

      {highlights.map(
        (item, index) => {

          if (
            item.type === "correct"
          ) {
            return (
              <span key={index}>
                {item.word}{" "}
              </span>
            );
          }

          const style =
            getHighlightStyle(
              item.type
            );

          return (
            <span
              key={index}
              className={`mx-[2px] inline rounded px-1.5 py-0.5 font-medium ${style}`}
              title={
                item.correctWord
                  ? `Correct word: ${item.correctWord}`
                  : getMistakeLabel(
                      item.type
                    )
              }
            >
              {item.word}{" "}
            </span>
          );
        }
      )}

    </div>
  );
}


/* =========================================================
   RULE BOX
========================================================= */

function RuleBox({
  title,
  text,
  color,
}: {
  title: string;
  text: string;
  color:
    | "red"
    | "yellow"
    | "orange"
    | "purple"
    | "blue"
    | "slate";
}) {
  const styles = {
    red: "border-red-200 bg-red-50",
    yellow:
      "border-yellow-200 bg-yellow-50",
    orange:
      "border-orange-200 bg-orange-50",
    purple:
      "border-purple-200 bg-purple-50",
    blue: "border-blue-200 bg-blue-50",
    slate:
      "border-slate-200 bg-slate-50",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${styles[color]}`}
    >
      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-600">
        {text}
      </p>
    </div>
  );
}


/* =========================================================
   STAT BOX
========================================================= */

function StatBox({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
    >
      <p className="text-xs font-semibold opacity-80">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}


/* =========================================================
   BREAKDOWN
========================================================= */

function BreakdownRow({
  label,
  value,
  className,
  dotClass,
}: {
  label: string;
  value: number;
  className: string;
  dotClass: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ${className}`}
    >
      <div className="flex items-center gap-3">

        <span
          className={`h-3 w-3 rounded-full ${dotClass}`}
        />

        <span className="text-sm font-medium">
          {label}
        </span>

      </div>

      <span className="font-bold">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="font-bold text-slate-800">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   LEGEND
========================================================= */

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">

      <span
        className={`h-4 w-4 rounded ${color}`}
      />

      <span>{label}</span>

    </div>
  );
}


/* =========================================================
   STEP HEADER
========================================================= */

function StepHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div>

      <div className="flex items-center gap-3">

        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
          {step}
        </span>

        <p className="text-sm font-semibold text-blue-600">
          STEP {step}
        </p>

      </div>

      <h2 className="mt-4 text-3xl font-bold">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   WORD FUNCTIONS
========================================================= */

function getWords(
  text: string
): string[] {
  return text.trim()
    ? text.trim().split(/\s+/)
    : [];
}


/*
 * Removes punctuation only for word comparison.
 * Punctuation itself is checked separately.
 */
function normalizeWord(
  word: string
): string {
  return word
    .toLowerCase()
    .replace(
      /[.,!?;:"“”‘’()[\]{}]/g,
      ""
    );
}


/*
 * Get punctuation at the end of a word.
 */
function getPunctuation(
  word: string
): string {
  const match = word.match(
    /[.,!?;:"“”‘’()[\]{}]+$/
  );

  return match ? match[0] : "";
}


/*
 * Remove punctuation from a word.
 */
function removePunctuation(
  word: string
): string {
  return word.replace(
    /[.,!?;:"“”‘’()[\]{}]/g,
    ""
  );
}


/* =========================================================
   SPELLING
========================================================= */

function isSpellingDifference(
  masterWord: string,
  typedWord: string
): boolean {
  const a =
    removePunctuation(
      masterWord
    ).toLowerCase();

  const b =
    removePunctuation(
      typedWord
    ).toLowerCase();

  if (!a || !b) return false;

  if (a === b) return false;

  const distance =
    levenshteinDistance(a, b);

  const maxLength =
    Math.max(
      a.length,
      b.length
    );

  return (
    distance <= 2 ||
    (maxLength >= 5 &&
      distance <= 3)
  );
}


/* =========================================================
   LEVENSHTEIN
========================================================= */

function levenshteinDistance(
  a: string,
  b: string
): number {
  const matrix: number[][] = [];

  for (
    let i = 0;
    i <= b.length;
    i++
  ) {
    matrix[i] = [i];
  }

  for (
    let j = 0;
    j <= a.length;
    j++
  ) {
    matrix[0][j] = j;
  }

  for (
    let i = 1;
    i <= b.length;
    i++
  ) {
    for (
      let j = 1;
      j <= a.length;
      j++
    ) {
      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {
        matrix[i][j] =
          matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j - 1] +
              1,
            matrix[i][j - 1] +
              1,
            matrix[i - 1][j] +
              1
          );
      }
    }
  }

  return matrix[b.length][a.length];
}


/* =========================================================
   PASSAGE ANALYSIS
========================================================= */

function analyzePassages(
  master: string[],
  typed: string[],
  exam: ExamType
): {
  wrongWords: number;
  missingWords: number;
  extraWords: number;
  spellingMistakes: number;
  punctuationMistakes: number;
  fullMistakes: number;
  halfMistakes: number;
  totalMistakes: number;
  highlights: HighlightItem[];
} {
  const highlights: HighlightItem[] = [];

  let wrongWords = 0;
  let missingWords = 0;
  let extraWords = 0;

  let spellingMistakes = 0;
  let punctuationMistakes = 0;

  let fullMistakes = 0;
  let halfMistakes = 0;

  let i = 0;
  let j = 0;

  /*
   * FULL MISTAKE:
   * Wrong word
   * Missing word
   * Extra word
   *
   * HALF MISTAKE:
   * Spelling difference
   * Punctuation difference
   *
   * DHC/AHC additionally check comma /
   * punctuation differences.
   */

  while (
    i < master.length ||
    j < typed.length
  ) {
    const masterWord =
      master[i];

    const typedWord =
      typed[j];

    /* END */
    if (
      masterWord === undefined &&
      typedWord === undefined
    ) {
      break;
    }

    /* EXTRA WORD */
    if (
      masterWord === undefined &&
      typedWord !== undefined
    ) {
      extraWords++;
      fullMistakes++;

      highlights.push({
        type: "extra",
        word: typedWord,
        index: j,
      });

      j++;
      continue;
    }

    /* MISSING WORD */
    if (
      typedWord === undefined &&
      masterWord !== undefined
    ) {
      missingWords++;
      fullMistakes++;

      highlights.push({
        type: "missing",
        word: `[${masterWord}]`,
        correctWord: masterWord,
        index: j,
      });

      i++;
      continue;
    }

    if (
      !masterWord ||
      !typedWord
    ) {
      i++;
      j++;
      continue;
    }

    const masterNormalized =
      normalizeWord(masterWord);

    const typedNormalized =
      normalizeWord(typedWord);

    /*
     * EXACT WORD
     */
    if (
      masterNormalized ===
      typedNormalized
    ) {
      const masterPunctuation =
        getPunctuation(
          masterWord
        );

      const typedPunctuation =
        getPunctuation(
          typedWord
        );

      /*
       * DHC/AHC comma and punctuation
       * differences are counted.
       *
       * We also retain punctuation
       * checking for SSC/DSSSB.
       */
      if (
        masterPunctuation !==
        typedPunctuation
      ) {
        punctuationMistakes++;
        halfMistakes++;

        highlights.push({
          type: "punctuation",
          word: typedWord,
          correctWord:
            masterWord,
          index: j,
        });
      } else {
        highlights.push({
          type: "correct",
          word: typedWord,
          index: j,
        });
      }

      i++;
      j++;
      continue;
    }

    /*
     * SPELLING
     */
    if (
      isSpellingDifference(
        masterWord,
        typedWord
      )
    ) {
      spellingMistakes++;
      halfMistakes++;

      highlights.push({
        type: "spelling",
        word: typedWord,
        correctWord:
          masterWord,
        index: j,
      });

      i++;
      j++;
      continue;
    }

    /*
     * EXTRA WORD:
     *
     * Example:
     *
     * Master:
     * I am going home
     *
     * Typed:
     * I am now going home
     */
    if (
      typed[j + 1] !== undefined &&
      normalizeWord(
        typed[j + 1]
      ) === masterNormalized
    ) {
      extraWords++;
      fullMistakes++;

      highlights.push({
        type: "extra",
        word: typedWord,
        index: j,
      });

      j++;
      continue;
    }

    /*
     * MISSING WORD:
     *
     * Master:
     * I am going home
     *
     * Typed:
     * I am home
     */
    if (
      master[i + 1] !== undefined &&
      normalizeWord(
        master[i + 1]
      ) === typedNormalized
    ) {
      missingWords++;
      fullMistakes++;

      highlights.push({
        type: "missing",
        word: `[${masterWord}]`,
        correctWord:
          masterWord,
        index: j,
      });

      i++;
      continue;
    }

    /*
     * WRONG WORD
     */
    wrongWords++;
    fullMistakes++;

    highlights.push({
      type: "wrong",
      word: typedWord,
      correctWord:
        masterWord,
      index: j,
    });

    i++;
    j++;
  }

  /*
   * Total displayed mistake events.
   *
   * Full and half are NOT added here
   * because they are categories of the
   * same mistakes.
   */
  const totalMistakes =
    wrongWords +
    missingWords +
    extraWords +
    spellingMistakes +
    punctuationMistakes;

  /*
   * Keep exam parameter intentionally
   * available for future exam-specific
   * rules.
   */
  void exam;

  return {
    wrongWords,
    missingWords,
    extraWords,

    spellingMistakes,
    punctuationMistakes,

    fullMistakes,
    halfMistakes,

    totalMistakes,

    highlights,
  };
}


/* =========================================================
   COLORS
========================================================= */

function getHighlightStyle(
  type:
    | MistakeType
    | "correct"
): string {
  switch (type) {
    case "wrong":
      return "bg-red-200 text-red-900";

    case "missing":
      return "bg-yellow-200 text-yellow-900";

    case "extra":
      return "bg-orange-200 text-orange-900";

    case "spelling":
      return "bg-purple-200 text-purple-900";

    case "punctuation":
      return "bg-blue-200 text-blue-900";

    default:
      return "";
  }
}


/* =========================================================
   MISTAKE LABEL
========================================================= */

function getMistakeLabel(
  type:
    | MistakeType
    | "correct"
): string {
  switch (type) {
    case "wrong":
      return "Wrong word";

    case "missing":
      return "Missing word";

    case "extra":
      return "Extra word";

    case "spelling":
      return "Spelling mistake";

    case "punctuation":
      return "Punctuation mistake";

    default:
      return "";
  }
}


/* =========================================================
   TIME
========================================================= */

function formatTime(
  seconds: number
): string {
  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}