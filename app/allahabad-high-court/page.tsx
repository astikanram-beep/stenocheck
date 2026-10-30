
"use client";

import { useRouter } from "next/navigation";

const examOptions = [
  {
    number: "01",
    title: "APS Judgment Typing",
    description:
      "Practise court judgments with text formatting, alignment and punctuation.",
    icon: "⚖️",
    route: "/allahabad-high-court/aps-judgment-typing/passages",
    colors: "from-violet-100 to-pink-100",
    accent: "text-violet-700",
  },
  {
    number: "02",
    title: "RO / ARO Typing",
    description:
      "Improve typing speed, accuracy and exam readiness for RO / ARO.",
    icon: "⌨️",
    route: "/allahabad-high-court/ro-aro-typing",
    colors: "from-sky-100 to-cyan-100",
    accent: "text-sky-700",
  },
  {
    number: "03",
    title: "Stenographer Typing",
    description:
      "Practise typing passages for Allahabad High Court Stenographer.",
    icon: "📝",
    route: "/allahabad-high-court/stenographer-typing",
    colors: "from-emerald-100 to-teal-100",
    accent: "text-emerald-700",
  },
  {
    number: "04",
    title: "Group C / Group D Typing",
    description:
      "Open typing practice for Group C and Group D from one place.",
    icon: "📚",
    route: "/allahabad-high-court/group-c-d-typing",
    colors: "from-amber-100 to-orange-100",
    accent: "text-orange-700",
  },
];

export default function AllahabadHighCourtPage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen p-4 sm:p-8"
      style={{
        background:
          "linear-gradient(115deg, #FF91B9 0%, #FFB875 18%, #FFE47A 35%, #8FE0A5 52%, #83D5F5 69%, #B5A0F5 85%, #F59BC9 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push("/main-dashboard")}
            className="rounded-xl border border-white/70 bg-white/90 px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-white"
          >
            ← Back to Dashboard
          </button>

          <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            StenoCheck · Practice Centre
          </div>
        </header>

        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-purple-800 to-pink-700 p-7 text-white shadow-xl sm:p-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-4xl">
            🏛️
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            Typing Practice Centre
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Allahabad High Court
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
            Choose your exam category and practise with a focused,
            exam-oriented typing experience. Track your performance
            and work towards greater speed and accuracy.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full bg-white/15 px-4 py-2">
              🎯 Exam-oriented practice
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              ⌨️ Typing skills
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2">
              📊 Performance review
            </span>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-900">
              Choose Your Test
            </h2>
            <p className="mt-2 text-sm text-slate-700 sm:text-base">
              Select one of the four practice categories below.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {examOptions.map((option) => (
              <button
                key={option.number}
                onClick={() => router.push(option.route)}
                className="group rounded-2xl border border-white/80 bg-white/95 p-5 text-left shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-2xl sm:p-7"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${option.colors} text-3xl`}
                  >
                    {option.icon}
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    TEST {option.number}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  {option.title}
                </h3>

                <p className="mt-3 min-h-[52px] text-sm leading-6 text-slate-600">
                  {option.description}
                </p>

                <div
                  className={`mt-6 flex items-center justify-between border-t border-slate-100 pt-4 font-bold ${option.accent}`}
                >
                  <span>Open Practice</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-10 pb-4 text-center text-sm font-semibold text-slate-800">
          StenoCheck · Practice with Precision · Keep Improving
        </footer>
      </div>
    </main>
  );
}
