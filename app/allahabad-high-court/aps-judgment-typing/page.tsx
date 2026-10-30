"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function APSJudgmentTypingPage() {
  const router = useRouter();
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const instructions = [
    "Type the selected judgment exactly as displayed in the reference document.",
    "Pay attention to spelling, punctuation, paragraph breaks and numbering.",
    "Reproduce bold, italic, underline and text alignment wherever required.",
    "Use the typing toolbar and keyboard shortcuts when available.",
    "Review your work before submitting the test.",
    "Your result will show typing mistakes and supported formatting differences.",
  ];

  const handleStartTest = async () => {
    if (!instructionsAccepted || isStarting) return;

    setIsStarting(true);

    // Full Screen ko user ke button click ke through activate karein.
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Full Screen unavailable ho tab bhi test open hoga.
    }

    // Passage select hone ke baad seedha Test Page par jaayein.
    router.push("/allahabad-high-court/aps-judgment-typing/test");
  };

  return (
    <main
      className="min-h-screen p-4 sm:p-8"
      style={{
        background:
          "linear-gradient(115deg, #FF91B9 0%, #FFB875 18%, #FFE47A 35%, #8FE0A5 52%, #83D5F5 69%, #B5A0F5 85%, #F59BC9 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Top navigation */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/allahabad-high-court/aps-judgment-typing/passages")
            }
            className="rounded-xl border border-white/70 bg-white/90 px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-white"
          >
            ← Back to Passage Selection
          </button>

          <span className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700">
            StenoCheck · APS Practice
          </span>
        </header>

        {/* Hero banner */}
        <section className="mb-6 rounded-3xl bg-gradient-to-r from-violet-900 via-purple-800 to-pink-700 p-7 text-white shadow-xl sm:p-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl">
            ⚖️
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
            Allahabad High Court
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            APS Judgment Typing
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
            Your judgment has been selected. Read the instructions carefully
            before starting your typing test.
          </p>
        </section>

        {/* Main content */}
        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-white/80 bg-white/95 p-6 shadow-lg sm:p-8">
            <h2 className="text-xl font-black text-slate-900">
              Test Instructions
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Read the instructions carefully before starting.
            </p>

            <ol className="mt-6 space-y-4">
              {instructions.map((instruction, index) => (
                <li key={instruction} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800">
                    {index + 1}
                  </span>

                  <p className="pt-1 text-sm leading-6 text-slate-700">
                    {instruction}
                  </p>
                </li>
              ))}
            </ol>

            {/* Important notice */}
            <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-amber-900">Important</p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                The test will start when you click the button below. The
                15-minute timer will run automatically on the test page.
                Submit your test before the timer reaches zero.
              </p>
            </div>

            {/* Declaration checkbox */}
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-300">
              <input
                type="checkbox"
                checked={instructionsAccepted}
                onChange={(event) =>
                  setInstructionsAccepted(event.target.checked)
                }
                className="mt-1 h-5 w-5 shrink-0 accent-violet-700"
              />

              <span className="text-sm leading-6 text-slate-700">
                I have read and understood all the test instructions. I am
                ready to begin the judgment typing test.
              </span>
            </label>

            {/* Start test */}
            <button
              type="button"
              disabled={!instructionsAccepted || isStarting}
              onClick={handleStartTest}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-700 to-pink-600 px-5 py-4 font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStarting
                ? "Opening Test..."
                : "Start Judgment Test →"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Your selected judgment will open on the test page.
            </p>
          </div>

          {/* Right information panel */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-white/80 bg-white/95 p-6 shadow-lg">
              <h2 className="text-lg font-black text-slate-900">
                What You Will Practise
              </h2>

              <div className="mt-5 space-y-5">
                {[
                  {
                    icon: "⌨️",
                    title: "Accurate Typing",
                    description: "Words, spelling and punctuation",
                  },
                  {
                    icon: "📄",
                    title: "Document Layout",
                    description: "Paragraphs, headings and numbering",
                  },
                  {
                    icon: "✍️",
                    title: "Text Formatting",
                    description: "Bold, italic, underline and alignment",
                  },
                  {
                    icon: "📊",
                    title: "Performance Review",
                    description: "Mistakes and marks after submission",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>

                    <div>
                      <p className="font-bold text-slate-800">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/95 p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🗂️</span>

                <h2 className="text-lg font-black text-slate-900">
                  Judgment Library
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Select your judgment before reaching this instruction page.
                The selected passage should be available on the test page.
              </p>

              <span className="mt-4 inline-block rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">
                Passage selected before test
              </span>
            </div>
          </aside>
        </section>

        <footer className="py-8 text-center text-sm font-semibold text-slate-800">
          StenoCheck · Practice with Precision · Keep Improving
        </footer>
      </div>
    </main>
  );
}