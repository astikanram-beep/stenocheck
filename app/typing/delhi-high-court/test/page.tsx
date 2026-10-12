
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type PerformancePoint = {
  minute: number;
  speed: number;
  wordsTyped: number;
};

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function DelhiHighCourtTypingTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const difficulty = searchParams.get("difficulty") || "easy";
  const passageNumber = Number(searchParams.get("passage") || "1");

  const difficultyTitle =
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  const [name, setName] = useState("");
  const [fontSize, setFontSize] = useState(20);
  const [highlightCurrentWord, setHighlightCurrentWord] = useState(false);

  const [isReady, setIsReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [backspaceCount, setBackspaceCount] = useState(0);
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformancePoint[]
  >([]);

  const [passage, setPassage] = useState("");
  const [loadingPassage, setLoadingPassage] = useState(true);
  const [passageError, setPassageError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const submittedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const lastRecordedMinuteRef = useRef(0);
  const latestTextRef = useRef("");
  const backspaceCountRef = useRef(0);
  const performanceHistoryRef = useRef<PerformancePoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPassage() {
      try {
        setLoadingPassage(true);
        setPassageError("");

        const passagesRef = collection(
          db,
          "dhcPassages",
          difficulty,
          "passages"
        );

        const passageQuery = query(
          passagesRef,
          where("passageNumber", "==", passageNumber),
          where("active", "==", true)
        );

        const snapshot = await getDocs(passageQuery);

        if (cancelled) return;

        if (snapshot.empty) {
          setPassageError(
            `Passage ${String(passageNumber).padStart(2, "0")} is not available for ${difficultyTitle}.`
          );
          setPassage("");
          return;
        }

        const data = snapshot.docs[0].data();

        if (typeof data.text !== "string" || !data.text.trim()) {
          setPassageError("Passage text is empty.");
          setPassage("");
          return;
        }

        setPassage(data.text);
      } catch (error) {
        if (cancelled) return;

        console.error("Error loading DHC passage:", error);
        setPassageError(
          "Unable to load the passage. Please check Firebase and try again."
        );
      } finally {
        if (!cancelled) setLoadingPassage(false);
      }
    }

    loadPassage();

    return () => {
      cancelled = true;
    };
  }, [difficulty, passageNumber, difficultyTitle]);

  const passageWords = useMemo(
    () => passage.split(/(\s+)/),
    [passage]
  );

  const totalWords = useMemo(
    () => countWords(passage),
    [passage]
  );

  const canStart =
    name.trim().length > 0 && isReady && passage.trim().length > 0;

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error) => {
        console.warn("Could not exit Full Screen:", error);
      });
    }
  }

  async function startTest() {
    if (!canStart || started) return;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn(
        "Full Screen could not be enabled. Starting in the current window.",
        error
      );
    }

    latestTextRef.current = "";
    backspaceCountRef.current = 0;
    performanceHistoryRef.current = [];
    lastRecordedMinuteRef.current = 0;
    startTimeRef.current = Date.now();

    setText("");
    setTimeLeft(600);
    setCurrentWordIndex(0);
    setBackspaceCount(0);
    setPerformanceHistory([]);
    setSubmitted(false);
    submittedRef.current = false;
    setStarted(true);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 200);
  }

  function handleTyping(e: ChangeEvent<HTMLTextAreaElement>) {
    const newText = e.target.value;

    latestTextRef.current = newText;
    setText(newText);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = e.currentTarget;

    if (e.key === "Backspace") {
      backspaceCountRef.current += 1;
      setBackspaceCount(backspaceCountRef.current);

      if (
        textarea.selectionStart === textarea.selectionEnd
      ) {
        const cursorPosition = textarea.selectionStart;
        const beforeCursor = textarea.value.slice(0, cursorPosition);

        if (cursorPosition > 0 && /\s$/.test(beforeCursor)) {
          setCurrentWordIndex((previous) =>
            Math.max(0, previous - 1)
          );
        }
      }
    }

    if (e.key === " " && currentWordIndex < totalWords - 1) {
      setCurrentWordIndex((previous) =>
        Math.min(previous + 1, totalWords - 1)
      );
    }

    if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
    }
  }

  function recordPerformance(elapsedSeconds: number) {
    const minute = Math.min(
      10,
      Math.floor(elapsedSeconds / 60)
    );

    if (
      minute < 1 ||
      minute > 10 ||
      minute <= lastRecordedMinuteRef.current
    ) {
      return;
    }

    const wordsTyped = countWords(latestTextRef.current);
    const elapsedMinutes = elapsedSeconds / 60;
    const speed =
      elapsedMinutes > 0
        ? Math.round(wordsTyped / elapsedMinutes)
        : 0;

    const point: PerformancePoint = {
      minute,
      speed,
      wordsTyped,
    };

    const updatedHistory = [
      ...performanceHistoryRef.current,
      point,
    ];

    performanceHistoryRef.current = updatedHistory;
    lastRecordedMinuteRef.current = minute;
    setPerformanceHistory(updatedHistory);
  }

  function submitTest() {
    if (submittedRef.current) return;

    submittedRef.current = true;

    const startedAt = startTimeRef.current;
    const elapsedSeconds = startedAt
      ? Math.min(
          600,
          Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        )
      : 0;

    // Record the final partial minute/test snapshot as well.
    const finalMinute = Math.min(
      10,
      Math.floor(elapsedSeconds / 60)
    );

    if (
      finalMinute > 0 &&
      finalMinute > lastRecordedMinuteRef.current
    ) {
      recordPerformance(elapsedSeconds);
    }

    setSubmitted(true);
    exitFullscreen();

    const finalText = latestTextRef.current;
    const finalWordCount = countWords(finalText);

    const testData = {
      name: name.trim(),
      masterPassage: passage,
      typedText: finalText,
      allottedMinutes: 10,
      requiredWpm: 40,
      totalMasterWords: totalWords,
      difficulty: difficultyTitle,
      passageNumber,
      exam: "DHC",

      // Newly recorded test information
      backspaceCount: backspaceCountRef.current,
      backspaceUsed: backspaceCountRef.current,
      performanceHistory: performanceHistoryRef.current,
      elapsedSeconds,
      wordsTyped: finalWordCount,
    };

    try {
      sessionStorage.setItem(
        "dhcTypingTestData",
        JSON.stringify(testData)
      );

      router.push("/typing/delhi-high-court/result");
    } catch (error) {
      console.error("Unable to save typing test result:", error);
      alert(
        "Test result could not be saved. Please check your browser settings and try again."
      );
      submittedRef.current = false;
      setSubmitted(false);
    }
  }

  useEffect(() => {
    if (!started || submitted) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = window.setTimeout(() => {
      const elapsedSeconds = Math.min(
        600,
        Math.max(
          0,
          Math.floor(
            (Date.now() - (startTimeRef.current ?? Date.now())) /
              1000
          )
        )
      );

      // Record one snapshot after each completed minute.
      if (
        elapsedSeconds > 0 &&
        elapsedSeconds % 60 === 0
      ) {
        recordPerformance(elapsedSeconds);
      }

      setTimeLeft(Math.max(0, 600 - elapsedSeconds));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [started, submitted, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timerText =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const lastMinute = timeLeft <= 60;

  if (loadingPassage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="rounded-3xl border bg-white p-10 text-center shadow-lg">
          <div className="text-4xl">⏳</div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Loading Passage...
          </h1>
          <p className="mt-2 text-slate-500">
            {difficultyTitle} • Passage{" "}
            {String(passageNumber).padStart(2, "0")}
          </p>
        </div>
      </main>
    );
  }

  if (passageError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-2xl rounded-3xl border bg-white p-10 text-center shadow-lg">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Passage Not Found
          </h1>
          <p className="mt-3 text-slate-600">{passageError}</p>
          <button
            onClick={() =>
              router.push(`/typing/delhi-high-court/${difficulty}`)
            }
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            ← Back to Passages
          </button>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() =>
              router.push(`/typing/delhi-high-court/${difficulty}`)
            }
            className="mb-8 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            ← Back to Passages
          </button>

          <div className="rounded-3xl border bg-white p-6 shadow-lg sm:p-10">
            <div className="text-center">
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                FREE PRACTICE
              </span>

              <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
                Delhi High Court Typing Test
              </h1>

              <p className="mt-2 text-slate-500">
                {difficultyTitle} • Passage{" "}
                {String(passageNumber).padStart(2, "0")}
              </p>
              <p className="mt-1 text-slate-500">
                10 Minutes • {totalWords} Words
              </p>
            </div>

            <div className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
              <h2 className="text-lg font-extrabold text-amber-900">
                ⚠️ Important Instructions
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                <div className="rounded-xl border border-red-300 bg-red-100 p-4 font-bold text-red-800">
                  ⚠️ Please do not type the passage again after completing it. You can check and edit your typing within the remaining time.
                </div>

                <p>This test measures both typing speed and accuracy.</p>
                <p>The total test duration is <strong>10 minutes</strong>.</p>
                <p>The test automatically submits when the timer reaches zero.</p>
                <p>You may check and edit your typing within the remaining time.</p>
                <p>The Master Passage can be scrolled while typing.</p>
                <p>
                  If Highlight Current Word is enabled, pressing{" "}
                  <strong>Space</strong> moves the highlight forward.
                </p>
                <p>
                  At a word boundary, pressing <strong>Backspace</strong>{" "}
                  moves the highlight back.
                </p>
                <p>
                  <strong>Default Highlight: OFF</strong>
                </p>
              </div>
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Candidate Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border bg-slate-50 p-5">
                <label className="block text-sm font-bold text-slate-800">
                  Font Size
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Applies to the passage and typing area.
                </p>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                  <option value={22}>22px</option>
                  <option value={24}>24px</option>
                  <option value={26}>26px</option>
                </select>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-800">
                  Typing Highlight
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Highlight moves with Space.
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="highlight"
                      checked={!highlightCurrentWord}
                      onChange={() => setHighlightCurrentWord(false)}
                    />
                    <span className="text-sm font-medium">
                      Without Highlight
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      DEFAULT
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="highlight"
                      checked={highlightCurrentWord}
                      onChange={() => setHighlightCurrentWord(true)}
                    />
                    <span className="text-sm font-medium">
                      Highlight Current Word
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-blue-100 bg-blue-50 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isReady}
                  onChange={(e) => setIsReady(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span>
                  <span className="block font-bold text-blue-900">
                    I am ready to start the typing test
                  </span>
                  <span className="mt-1 block text-sm text-blue-700">
                    I have read and understood the instructions above.
                  </span>
                </span>
              </label>
            </div>

            <button
              onClick={startTest}
              disabled={!canStart}
              className={`mt-8 w-full rounded-xl py-4 text-lg font-bold transition ${
                canStart
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              {canStart
                ? "I am ready to start the typing test →"
                : "Enter Name & Confirm Readiness"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-lg">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            Test Submitted
          </h1>
          <p className="mt-3 text-slate-600">
            Thank you, {name}.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden bg-slate-100">
      <div
        className={`fixed right-4 top-4 z-[60] rounded-xl px-5 py-3 text-2xl font-extrabold shadow-lg sm:right-6 sm:top-6 ${
          lastMinute
            ? "animate-pulse bg-red-100 text-red-700"
            : "bg-white text-slate-800"
        }`}
      >
        {timerText}
      </div>

      <div className="grid h-full w-full grid-rows-[46%_54%] gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
        <section className="flex min-h-0 flex-col rounded-2xl border bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-2 flex shrink-0 items-center justify-between pr-24">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Master Passage
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 sm:text-sm">
              {totalWords} words
            </span>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 sm:p-5"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {passageWords.map((part, index) => {
              if (/^\s+$/.test(part)) {
                return <span key={index}>{part}</span>;
              }

              const wordIndex = passageWords
                .slice(0, index)
                .filter((item) => !/^\s+$/.test(item)).length;

              const isCurrentWord =
                highlightCurrentWord &&
                wordIndex === currentWordIndex;

              return (
                <span
                  key={index}
                  className={
                    isCurrentWord
                      ? "rounded bg-yellow-200 px-1 font-semibold"
                      : ""
                  }
                >
                  {part}
                </span>
              );
            })}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Typing Passage
            </h2>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500 sm:text-sm">
              <span>{countWords(text)} words typed</span>
              <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                Backspace: {backspaceCount}
              </span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            placeholder="Start typing the passage here..."
            className="min-h-0 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:p-5"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          />

          <div className="mt-2 flex shrink-0 items-center justify-between gap-3">
            <span className="text-xs text-slate-500 sm:text-sm">
              Test ends automatically at 00:00.
            </span>
            <button
              type="button"
              onClick={submitTest}
              className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-700 sm:px-8"
            >
              Submit Test
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DelhiHighCourtTypingTest() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-2xl border bg-white px-8 py-6 shadow-lg">
            <div className="text-center text-lg font-bold text-slate-700">
              Loading Typing Test...
            </div>
          </div>
        </main>
      }
    >
      <DelhiHighCourtTypingTestContent />
    </Suspense>
  );
}
