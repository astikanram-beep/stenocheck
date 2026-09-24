"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_PASSAGE = `The administration of justice is the primary duty of the judiciary, and the High Courts play a pivotal role in maintaining the rule of law. In a democratic setup, the legal system must be accessible, transparent, and efficient to ensure that every citizen receives a fair trial. Over the years, the number of pending cases across various district courts and high courts has increased significantly. This backlog poses a serious challenge to the legal machinery, making the timely disposal of litigations a matter of utmost priority for judicial reforms. To tackle this pendency, the Delhi High Court has taken several progressive steps by introducing modern technology into daily court proceedings. The implementation of e-filing systems, digital display boards, and virtual hearings has transformed how legal matters are managed. Lawyers and litigants can now file petitions online, saving valuable time and reducing the heavy reliance on physical paper documents. However, the success of these digital initiatives depends heavily on the technical proficiency of the court staff, including data entry operators, stenographers, and judicial assistants. Apart from technological advancements, the fundamental principles of law remain rooted in constitutional jurisprudence. The Constitution of India guarantees fundamental rights to all citizens, and the judiciary acts as the custodian of these rights. Whenever an individual's rights are violated, they can approach the High Court under Article 226 by filing a writ petition. The court carefully examines the merits of the case, hears arguments from both sides, and delivers an impartial judgment based on established precedents and statutes. Legal terminology, complex phrasing, and precise formatting are integral parts of these official orders. Therefore, candidates aspiring to work in the judicial sector must possess exceptional clerical skills, especially accurate typing and data management capabilities. A small typographical error in a court order can alter its entire meaning, leading to serious legal consequences. Regular practice with diverse legal texts, judgments, and notifications is essential to clear the prescribed speed threshold. Developing a consistent rhythm while typing will help maintain accuracy under exam pressure. Ultimately, dedication and rigorous practice are the keys to succeeding in this competitive examination and securing a prestigious position within the honorable court administration. Furthermore, candidates must focus on understanding how administrative rules govern day-to-day operations. Every judicial institution requires deep commitment, strong concentration, and a flawless work ethic from its technical staff. Efficient documentation helps judges make prompt decisions without causing unnecessary delays. Practicing`;

export default function DelhiHighCourtTypingTest() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [fontSize, setFontSize] = useState(20);

  const [highlightCurrentWord, setHighlightCurrentWord] =
    useState(false);

  const [isReady, setIsReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  /* =====================================================
     PASSAGE
  ===================================================== */

  const passageWords = useMemo(() => {
    return DEMO_PASSAGE.split(/(\s+)/);
  }, []);

  const totalWords = useMemo(() => {
    return DEMO_PASSAGE.trim().split(/\s+/).length;
  }, []);

  const canStart =
    name.trim().length > 0 && isReady;

  /* =====================================================
     TIMER
  ===================================================== */

  useEffect(() => {
    if (!started || submitted) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, submitted, timeLeft]);

  /* =====================================================
     START TEST
  ===================================================== */

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

  /* =====================================================
     TYPING
  ===================================================== */

  function handleTyping(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setText(e.target.value);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    });
  }

  /* =====================================================
     KEYBOARD
  ===================================================== */

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    const textarea = e.currentTarget;

    /*
     * SPACE
     * Move highlight to next word.
     *
     * It works even if the candidate has not
     * correctly typed the previous word.
     */

    if (e.key === " ") {
      setCurrentWordIndex((previous) => {
        if (previous < totalWords - 1) {
          return previous + 1;
        }

        return previous;
      });

      return;
    }

    /*
     * BACKSPACE
     * At a word boundary, move highlight
     * one word backwards.
     */

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
        setCurrentWordIndex((previous) => {
          if (previous > 0) {
            return previous - 1;
          }

          return 0;
        });
      }
    }

    /*
     * Prevent page scrolling with arrow/page keys
     * while typing.
     */

    if (
      e.key === "PageUp" ||
      e.key === "PageDown"
    ) {
      e.preventDefault();
    }
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  function submitTest() {
    if (submitted) return;

    setSubmitted(true);

    const testData = {
      name,
      masterPassage: DEMO_PASSAGE,
      typedText: text,
      allottedMinutes: 10,
      requiredWpm: 40,
      totalMasterWords: totalWords,
      difficulty: "Easy",
      passageNumber: 1,
    };

    sessionStorage.setItem(
      "dhcTypingTestData",
      JSON.stringify(testData)
    );

    router.push(
      "/typing/delhi-high-court/result"
    );
  }

  /* =====================================================
     TIMER TEXT
  ===================================================== */

  const minutes = Math.floor(
    timeLeft / 60
  );

  const seconds = timeLeft % 60;

  const timerText =
    `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

  const lastMinute =
    timeLeft <= 60;

  /* =====================================================
     INSTRUCTIONS SCREEN
  ===================================================== */

  if (!started) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">

        <div className="mx-auto max-w-4xl">

          <button
            onClick={() =>
              router.push(
                "/typing/delhi-high-court/easy"
              )
            }
            className="mb-8 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            ← Back to Passages
          </button>

          <div className="rounded-3xl border bg-white p-6 shadow-lg sm:p-10">

            {/* TITLE */}

            <div className="text-center">

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                FREE PRACTICE
              </span>

              <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
                Delhi High Court Typing Test
              </h1>

              <p className="mt-2 text-slate-500">
                10 Minutes • {totalWords} Words
              </p>

            </div>

            {/* INSTRUCTIONS */}

            <div className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">

              <h2 className="text-lg font-extrabold text-amber-900">
                ⚠️ Important Instructions
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-700">

                <div className="rounded-xl border border-red-300 bg-red-100 p-4 font-bold text-red-800">
                  ⚠️ Please don't type again your passage after
                  completing the passage. After completing the
                  passage, you can check and edit it within the
                  given time.
                </div>

                <p>
                  This is a test of{" "}
                  <strong>
                    accuracy with speed
                  </strong>
                  . Do not sacrifice accuracy just to increase
                  your speed.
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
                  The test will automatically submit when
                  the timer reaches zero.
                </p>

                <p>
                  You may check and edit your typing within
                  the remaining time.
                </p>

                <p>
                  The Master Passage can be manually scrolled
                  while typing.
                </p>

                <p>
                  If Highlight Current Word is enabled,
                  pressing{" "}
                  <strong>Space</strong>{" "}
                  moves the highlight to the next word.
                </p>

                <p>
                  At a word boundary, pressing{" "}
                  <strong>Backspace</strong>{" "}
                  moves the highlight back to the previous
                  word.
                </p>

                <p>
                  <strong>
                    Default Highlight: OFF
                  </strong>
                </p>

              </div>

            </div>

            {/* NAME */}

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

            {/* SETTINGS */}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              {/* FONT */}

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
                      Number(e.target.value)
                    )
                  }
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value={18}>
                    18px
                  </option>

                  <option value={20}>
                    20px
                  </option>

                  <option value={22}>
                    22px
                  </option>

                  <option value={24}>
                    24px
                  </option>

                  <option value={26}>
                    26px
                  </option>

                </select>

              </div>

              {/* HIGHLIGHT */}

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

            {/* READY */}

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
                    I have read and understood all
                    the instructions given above.
                  </span>

                </span>

              </label>

            </div>

            {/* START */}

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

  /* =====================================================
     SUBMITTED
  ===================================================== */

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
                "/typing/delhi-high-court/easy"
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

  /* =====================================================
     ACTUAL TYPING TEST SCREEN
  ===================================================== */

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-100">

      {/* =================================================
          FIXED TIMER
      ================================================= */}

      <div
        className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-2 text-lg font-extrabold shadow-lg ${
          lastMinute
            ? "animate-pulse bg-red-100 text-red-700"
            : "bg-white text-slate-800"
        }`}
      >
        {timerText}
      </div>

      {/* =================================================
          MAIN TEST CONTAINER
      ================================================= */}

      <div className="mx-auto grid h-full w-full max-w-7xl grid-rows-[42%_58%] gap-3 overflow-hidden px-4 py-4 sm:px-6">

        {/* =================================================
            MASTER PASSAGE
        ================================================= */}

        <section className="flex min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm">

          <div className="mb-2 flex shrink-0 items-center justify-between pr-24">

            <h2 className="text-xl font-bold text-slate-900">
              Master Passage
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
              {totalWords} words
            </span>

          </div>

          {/* MASTER PASSAGE BOX */}

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

        {/* =================================================
            TYPING AREA
        ================================================= */}

        <section className="flex min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm">

          <h2 className="mb-2 shrink-0 text-xl font-bold text-slate-900">
            Typing Passage
          </h2>

          {/* TYPING BOX */}

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

          {/* SUBMIT */}

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