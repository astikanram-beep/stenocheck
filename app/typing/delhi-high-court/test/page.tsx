"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

function DelhiHighCourtTypingTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const difficulty =
    searchParams.get("difficulty") || "easy";

  const passageNumber = Number(
    searchParams.get("passage") || "1"
  );

  const difficultyTitle =
    difficulty.charAt(0).toUpperCase() +
    difficulty.slice(1);

  const [name, setName] = useState("");
  const [fontSize, setFontSize] = useState(20);

  const [highlightCurrentWord, setHighlightCurrentWord] =
    useState(false);

  const [isReady, setIsReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [text, setText] = useState("");

  const [timeLeft, setTimeLeft] = useState(600);

  const [currentWordIndex, setCurrentWordIndex] =
    useState(0);

  const [passage, setPassage] = useState("");

  const [loadingPassage, setLoadingPassage] =
    useState(true);

  const [passageError, setPassageError] =
    useState("");

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
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
          where(
            "passageNumber",
            "==",
            passageNumber
          ),
          where("active", "==", true)
        );

        const snapshot =
          await getDocs(passageQuery);

        if (snapshot.empty) {
          setPassageError(
            `Passage ${String(
              passageNumber
            ).padStart(
              2,
              "0"
            )} is not available for ${difficultyTitle}.`
          );

          setPassage("");
          return;
        }

        const data =
          snapshot.docs[0].data();

        if (!data.text) {
          setPassageError(
            "Passage text is empty."
          );

          setPassage("");
          return;
        }

        setPassage(data.text);
      } catch (error) {
        console.error(
          "Error loading DHC passage:",
          error
        );

        setPassageError(
          "Unable to load the passage. Please check Firebase and try again."
        );
      } finally {
        setLoadingPassage(false);
      }
    }

    loadPassage();
  }, [
    difficulty,
    passageNumber,
    difficultyTitle,
  ]);

  const passageWords = useMemo(() => {
    return passage.split(/(\s+)/);
  }, [passage]);

  const totalWords = useMemo(() => {
    return passage.trim()
      ? passage.trim().split(/\s+/).length
      : 0;
  }, [passage]);

  const canStart =
    name.trim().length > 0 &&
    isReady &&
    passage.length > 0;

  useEffect(() => {
    if (!started || submitted) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(
        (previous) => previous - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    started,
    submitted,
    timeLeft,
  ]);

  function startTest() {
    if (!canStart) return;

    setStarted(true);
    setSubmitted(false);
    setTimeLeft(600);
    setText("");
    setCurrentWordIndex(0);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }

  function handleTyping(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setText(e.target.value);

    requestAnimationFrame(() => {
      const textarea =
        textareaRef.current;

      if (textarea) {
        textarea.scrollTop =
          textarea.scrollHeight;
      }
    });
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    const textarea =
      e.currentTarget;

    if (e.key === " ") {
      setCurrentWordIndex(
        (previous) => {
          if (
            previous <
            totalWords - 1
          ) {
            return previous + 1;
          }

          return previous;
        }
      );

      return;
    }

    if (
      e.key === "Backspace" &&
      textarea.selectionStart ===
        textarea.selectionEnd
    ) {
      const cursorPosition =
        textarea.selectionStart;

      const beforeCursor =
        textarea.value.slice(
          0,
          cursorPosition
        );

      const atWordBoundary =
        cursorPosition > 0 &&
        /\s$/.test(beforeCursor);

      if (atWordBoundary) {
        setCurrentWordIndex(
          (previous) => {
            if (previous > 0) {
              return previous - 1;
            }

            return 0;
          }
        );
      }
    }

    if (
      e.key === "PageUp" ||
      e.key === "PageDown"
    ) {
      e.preventDefault();
    }
  }

  function submitTest() {
    if (submitted) return;

    setSubmitted(true);

    const testData = {
      name,
      masterPassage: passage,
      typedText: text,
      allottedMinutes: 10,
      requiredWpm: 40,
      totalMasterWords: totalWords,
      difficulty: difficultyTitle,
      passageNumber,
      exam: "DHC",
    };

    sessionStorage.setItem(
      "dhcTypingTestData",
      JSON.stringify(testData)
    );

    router.push(
      "/typing/delhi-high-court/result"
    );
  }

  const minutes =
    Math.floor(timeLeft / 60);

  const seconds =
    timeLeft % 60;

  const timerText =
    `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;

  const lastMinute =
    timeLeft <= 60;

  if (loadingPassage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="rounded-3xl border bg-white p-10 text-center shadow-lg">
          <div className="text-4xl">
            ⏳
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Loading Passage...
          </h1>

          <p className="mt-2 text-slate-500">
            {difficultyTitle} • Passage{" "}
            {String(passageNumber).padStart(
              2,
              "0"
            )}
          </p>
        </div>
      </main>
    );
  }

  if (passageError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-2xl rounded-3xl border bg-white p-10 text-center shadow-lg">
          <div className="text-5xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Passage Not Found
          </h1>

          <p className="mt-3 text-slate-600">
            {passageError}
          </p>

          <button
            onClick={() =>
              router.push(
                `/typing/delhi-high-court/${difficulty}`
              )
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
              router.push(
                `/typing/delhi-high-court/${difficulty}`
              )
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
                {String(
                  passageNumber
                ).padStart(2, "0")}
              </p>

              <p className="mt-1 text-slate-500">
                10 Minutes •{" "}
                {totalWords} Words
              </p>
            </div>

            <div className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
              <h2 className="text-lg font-extrabold text-amber-900">
                ⚠️ Important Instructions
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                <div className="rounded-xl border border-red-300 bg-red-100 p-4 font-bold text-red-800">
                  ⚠️ Please don't type again your passage after completing the passage. After completing the passage, you can check and edit it within the given time.
                </div>

                <p>
                  This is a test of{" "}
                  <strong>
                    accuracy with speed
                  </strong>
                  . Do not sacrifice accuracy just to increase your speed.
                </p>

                <p>
                  Try to maintain a good balance between{" "}
                  <strong>
                    typing speed and accuracy
                  </strong>
                  .
                </p>

                <p>
                  The total test duration is{" "}
                  <strong>
                    10 minutes
                  </strong>
                  .
                </p>

                <p>
                  The test will automatically submit when the timer reaches zero.
                </p>

                <p>
                  You may check and edit your typing within the remaining time.
                </p>

                <p>
                  The Master Passage can be manually scrolled while typing.
                </p>

                <p>
                  If Highlight Current Word is enabled, pressing{" "}
                  <strong>
                    Space
                  </strong>{" "}
                  moves the highlight to the next word.
                </p>

                <p>
                  At a word boundary, pressing{" "}
                  <strong>
                    Backspace
                  </strong>{" "}
                  moves the highlight back to the previous word.
                </p>

                <p>
                  <strong>
                    Default Highlight: OFF
                  </strong>
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
                onChange={(e) =>
                  setName(e.target.value)
                }
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
                  Applies to both passage and typing area.
                </p>

                <select
                  value={fontSize}
                  onChange={(e) =>
                    setFontSize(
                      Number(
                        e.target.value
                      )
                    )
                  }
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
                      checked={
                        !highlightCurrentWord
                      }
                      onChange={() =>
                        setHighlightCurrentWord(
                          false
                        )
                      }
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
                      checked={
                        highlightCurrentWord
                      }
                      onChange={() =>
                        setHighlightCurrentWord(
                          true
                        )
                      }
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
                  onChange={(e) =>
                    setIsReady(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-5 w-5"
                />

                <span>
                  <span className="block font-bold text-blue-900">
                    I am ready to start the typing test
                  </span>

                  <span className="mt-1 block text-sm text-blue-700">
                    I have read and understood all the instructions given above.
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
                ? "Start Typing Test →"
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
          <div className="text-5xl">
            ✅
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            Test Submitted
          </h1>

          <p className="mt-3 text-slate-600">
            Thank you, {name}.
          </p>

          <button
            onClick={() =>
              router.push(
                `/typing/delhi-high-court/${difficulty}`
              )
            }
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            Back to Passages
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-100">
      <div
        className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-2 text-lg font-extrabold shadow-lg ${
          lastMinute
            ? "animate-pulse bg-red-100 text-red-700"
            : "bg-white text-slate-800"
        }`}
      >
        {timerText}
      </div>

      <div className="mx-auto grid h-full w-full max-w-7xl grid-rows-[42%_58%] gap-3 overflow-hidden px-4 py-4 sm:px-6">
        <section className="flex min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 flex shrink-0 items-center justify-between pr-24">
            <h2 className="text-xl font-bold text-slate-900">
              Master Passage
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
              {totalWords} words
            </span>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-800"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.9",
            }}
          >
            {passageWords.map(
              (part, index) => {
                const isSpace =
                  /^\s+$/.test(part);

                if (isSpace) {
                  return (
                    <span key={index}>
                      {part}
                    </span>
                  );
                }

                const wordIndex =
                  passageWords
                    .slice(0, index)
                    .filter(
                      (item) =>
                        !/^\s+$/.test(item)
                    ).length;

                const isCurrentWord =
                  highlightCurrentWord &&
                  wordIndex ===
                    currentWordIndex;

                return (
                  <span
                    key={index}
                    className={
                      isCurrentWord
                        ? "rounded bg-yellow-100 px-1 font-semibold"
                        : ""
                    }
                  >
                    {part}
                  </span>
                );
              }
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 shrink-0 text-xl font-bold text-slate-900">
            Typing Passage
          </h2>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            disabled={submitted}
            placeholder="Start typing the passage here..."
            className="min-h-0 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-300 bg-white p-5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.9",
            }}
          />

          <div className="mt-3 flex shrink-0 justify-end">
            <button
              type="button"
              onClick={submitTest}
              disabled={submitted}
              className="rounded-xl bg-green-600 px-8 py-3 font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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