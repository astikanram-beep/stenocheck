
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MainDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attemptedOpen, setAttemptedOpen] = useState(false);

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 17
      ? "Good Afternoon"
      : hour < 21
      ? "Good Evening"
      : "Good Night";

  const stats = [
    {
      title: "Tests Attempted",
      value: "—",
      icon: "📝",
      color: "bg-violet-100",
    },
    {
      title: "Average Accuracy",
      value: "—",
      icon: "🎯",
      color: "bg-emerald-100",
    },
    {
      title: "Average Speed",
      value: "—",
      icon: "⚡",
      color: "bg-amber-100",
    },
    {
      title: "Total Mistakes",
      value: "—",
      icon: "📊",
      color: "bg-pink-100",
    },
  ];

  return (
    <main
      className="min-h-screen p-3 sm:p-5"
      style={{
        background:
         
"linear-gradient(115deg, #FF91B9 0%, #FFB875 18%, #FFE47A 35%, #8FE0A5 52%, #83D5F5 69%, #B5A0F5 85%, #F59BC9 100%)"

      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1600px] overflow-hidden rounded-3xl border border-white/40 bg-transparent shadow-2xl">

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } hidden shrink-0 flex-col border-r border-white/30 bg-white/95 p-4 transition-all duration-300 md:flex`}
        >
          {/* Logo */}
          <div className="mb-10 flex items-center justify-between gap-2">
            {sidebarOpen && (
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Steno<span className="text-violet-600">Check</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Practice with Precision
                </p>
              </div>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-violet-100"
              aria-label="Toggle sidebar"
              title="Collapse or expand sidebar"
            >
              ☰
            </button>
          </div>

          {sidebarOpen && (
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Workspace
            </p>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => router.push("/main-dashboard")}
              title="Dashboard"
              className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-violet-700 to-pink-600 px-3 py-3 text-left font-semibold text-white shadow-md"
            >
              <span className="text-lg">▦</span>
              {sidebarOpen && "Dashboard"}
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              title="Steno Passage Check"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium text-slate-600 transition hover:bg-violet-100 hover:text-violet-700"
            >
              <span className="text-lg">📝</span>
              {sidebarOpen && "Steno Check"}
            </button>

            <button
              onClick={() => router.push("/typing/delhi-high-court")}
              title="Typing Lab"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="text-lg">⌨️</span>
              {sidebarOpen && "Typing Lab"}
            </button>

            {/* Attempted Tests with submenu */}
            <div>
              <button
                onClick={() => setAttemptedOpen(!attemptedOpen)}
                title="Attempted Tests"
                aria-expanded={attemptedOpen}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left font-medium text-slate-600 transition hover:bg-violet-100 hover:text-violet-700"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">📚</span>
                  {sidebarOpen && "Attempted Tests"}
                </span>

                {sidebarOpen && (
                  <span className="text-xs">
                    {attemptedOpen ? "▲" : "▼"}
                  </span>
                )}
              </button>

              {sidebarOpen && attemptedOpen && (
                <div className="ml-5 mt-2 space-y-1 border-l-2 border-violet-300 pl-3">
                  <button
                    onClick={() =>
                      router.push("/attempted-tests?type=shorthand")
                    }
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                  >
                    📝 Shorthand Test
                  </button>

                  <button
                    onClick={() =>
                      router.push("/attempted-tests?type=typing")
                    }
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                  >
                    ⌨️ Typing Test
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Profile at bottom */}
          <div className="mt-auto border-t border-slate-200 pt-4">
            <button
              onClick={() => router.push("/profile")}
              title="My Profile"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-slate-700 hover:bg-pink-100 hover:text-pink-700"
            >
              <span className="text-lg">👤</span>
              {sidebarOpen && "My Profile"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <section className="min-w-0 flex-1 p-4 sm:p-7 lg:p-9">

          {/* Top Bar */}
          <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm md:hidden"
                aria-label="Toggle menu"
              >
                ☰
              </button>

              <div>
                <p className="text-sm text-slate-600">
                  StenoCheck / Workspace
                </p>
                <p className="font-semibold text-slate-900">
                  Your learning dashboard
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 rounded-2xl border border-white bg-white px-3 py-2 shadow-md transition hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-lg text-white">
                👤
              </div>

              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">
                  My Profile
                </p>
                <p className="text-xs text-slate-500">
                  View account
                </p>
              </div>
            </button>
          </header>

          {/* Welcome Banner */}
          <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-purple-700 to-pink-600 p-6 text-white shadow-xl sm:p-9">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-2 font-medium text-white/90">
                {greeting} 👋
              </p>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Ready to improve your skills?
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
                Every practice session brings you closer to your target.
                Build speed, improve accuracy and track your progress.
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-violet-800 shadow-md transition hover:-translate-y-0.5 hover:bg-violet-50"
              >
                Start Practising →
              </button>
            </div>

            <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-pink-300/20" />
          </section>

          {/* Statistics */}
          <section className="mb-9">
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-900">
                Your Overview
              </h2>
              <p className="mt-1 text-sm text-slate-700">
                Your practice performance at a glance
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-white bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">
                      {stat.title}
                    </p>

                    <div
                      className={`rounded-xl p-3 text-xl ${stat.color}`}
                    >
                      {stat.icon}
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-black text-slate-900">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Practice data will appear here
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Practice Centre */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-900">
                Practice Centre
              </h2>

              <p className="mt-1 text-sm text-slate-700">
                Choose an exam or skill to practise today.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">

              {/* Steno Passage Check */}
              <button
                onClick={() => router.push("/dashboard")}
                className="group rounded-2xl border border-violet-200 bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
                  📝
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Steno Passage Check
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Check your transcription, find mistakes and analyse your
                  performance.
                </p>

                <p className="mt-5 font-bold text-violet-700 group-hover:text-violet-900">
                  Open Steno Test →
                </p>
              </button>

              {/* Delhi High Court */}
              <button
                onClick={() => router.push("/typing/delhi-high-court")}
                className="group rounded-2xl border border-blue-200 bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                  🏛️
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Delhi High Court
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Practise exam-oriented typing passages and improve speed
                  and accuracy.
                </p>

                <p className="mt-5 font-bold text-blue-700 group-hover:text-blue-900">
                  Start Typing →
                </p>
              </button>

              {/* Allahabad High Court */}
<button
  type="button"
  onClick={() => router.push("/allahabad-high-court")}
  className="group w-full rounded-2xl border border-orange-200 bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl"
>
  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
    🏛️
  </div>

  <h3 className="text-lg font-bold text-slate-900">
    Allahabad High Court
  </h3>

  <p className="mt-2 text-sm leading-6 text-slate-600">
    Practise APS judgment typing with exam-oriented passages.
  </p>

  <span className="mt-5 inline-block rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
    Open Practice →
  </span>
</button>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 border-t border-white/50 pt-5 text-center text-sm font-medium text-slate-800">
            StenoCheck · Practice with Precision · Keep improving every day
          </footer>
        </section>
      </div>
    </main>
  );
}
