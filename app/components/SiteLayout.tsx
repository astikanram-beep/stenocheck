
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar default mein band rahega
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attemptedOpen, setAttemptedOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTypingTest =
    pathname.startsWith(
      "/allahabad-high-court/aps-judgment-typing/test"
    ) || pathname.startsWith("/typing/");

  // In pages par common layout hide rahega
  if (
    pathname === "/" ||
    pathname === "/main-dashboard" ||
    isTypingTest
  ) {
    return <>{children}</>;
  }

  const navItems = [
    {
      label: "Dashboard",
      icon: "▦",
      path: "/main-dashboard",
    },
    {
      label: "Steno Check",
      icon: "📝",
      path: "/dashboard",
    },
    {
      label: "Delhi High Court PS/APS Typing",
      icon: "⌨️",
      path: "/typing/delhi-high-court",
    },
    {
      label: "Allahabad High Court",
      icon: "🏛️",
      path: "/allahabad-high-court",
    },
  ];

  const closeSidebar = () => {
    setSidebarOpen(false);
    setMobileOpen(false);
  };

  const navigateTo = (path: string) => {
    router.push(path);
    closeSidebar();
  };

  const sidebar = (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/50 bg-white/95 p-4 shadow-xl backdrop-blur">
      <div className="mb-8 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Steno<span className="text-violet-600">Check</span>
          </h2>
          <p className="text-xs text-slate-500">
            Practice with Precision
          </p>
        </div>

        <button
          type="button"
          onClick={closeSidebar}
          className="rounded-xl bg-slate-100 p-2 text-slate-700 transition hover:bg-violet-100"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          ✕
        </button>
      </div>

      <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
        Workspace
      </p>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.path;

          return (
            <button
              type="button"
              key={item.path}
              onClick={() => navigateTo(item.path)}
              title={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium transition ${
                active
                  ? "bg-gradient-to-r from-violet-700 to-pink-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-violet-100 hover:text-violet-700"
              }`}
            >
              <span className="shrink-0 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <div>
          <button
            type="button"
            onClick={() => setAttemptedOpen(!attemptedOpen)}
            aria-expanded={attemptedOpen}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left font-medium text-slate-600 transition hover:bg-violet-100 hover:text-violet-700"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">📚</span>
              Attempted Tests
            </span>
            <span>{attemptedOpen ? "▲" : "▼"}</span>
          </button>

          {attemptedOpen && (
            <div className="ml-5 mt-2 space-y-1 border-l-2 border-violet-300 pl-3">
              <button
                type="button"
                onClick={() =>
                  navigateTo("/attempted-tests?type=shorthand")
                }
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-violet-100"
              >
                📝 Shorthand Test
              </button>

              <button
                type="button"
                onClick={() =>
                  navigateTo("/attempted-tests?type=typing")
                }
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-blue-100"
              >
                ⌨️ Typing Test
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => navigateTo("/profile")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-slate-700 transition hover:bg-pink-100 hover:text-pink-700"
        >
          <span className="text-lg">👤</span>
          My Profile
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(115deg,#FF91B9_0%,#FFB875_18%,#FFE47A_35%,#8FE0A5_52%,#83D5F5_69%,#B5A0F5_85%,#F59BC9_100%)] md:flex">
      {/* Desktop: sidebar sirf menu click par khulega */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 hidden md:block">
          {sidebar}
        </div>
      )}

      {/* Desktop sidebar ke peeche click karne par close */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 hidden bg-black/20 md:block"
        />
      )}

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="h-full max-w-[85vw]">{sidebar}</div>
          <button
            type="button"
            className="flex-1 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="relative z-30 flex items-center justify-between gap-3 border-b border-white/50 bg-white/40 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setAttemptedOpen(false);
            }}
            className="rounded-xl border border-white/70 bg-white/80 p-3 text-xl text-slate-700 shadow-sm transition hover:bg-white"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            title="Toggle sidebar"
          >
            ☰
          </button>

          <p className="text-sm font-bold text-slate-800 sm:text-base">
            StenoCheck / Workspace
          </p>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            title="My Profile"
            aria-label="Open My Profile"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-xl text-white shadow-md transition hover:scale-105"
          >
            👤
          </button>
        </header>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
