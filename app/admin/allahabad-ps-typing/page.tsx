
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

const ADMIN_EMAIL = "prakashra70710@gmail.com";
const COLLECTION_NAME = "allahabadPsJudgments";

type Judgment = {
  id: string;
  title: string;
  text: string;
  access: "free" | "paid";
  active: boolean;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const firebaseError = error as Error & { code?: string };
    return `${firebaseError.code ?? "unknown"}: ${firebaseError.message}`;
  }

  return String(error);
}

export default function AllahabadPSAdminPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [title, setTitle] = useState("");
  const [judgmentText, setJudgmentText] = useState("");
  const [access, setAccess] = useState<"free" | "paid">("free");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAdmin =
        !!user?.email &&
        user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      setAuthorized(isAdmin);
      setCheckingAuth(false);

      console.log("Admin authentication status:", {
        signedIn: !!user,
        email: user?.email ?? null,
        emailVerified: user?.emailVerified ?? false,
        projectId: db.app.options.projectId ?? null,
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorized) return;

    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        const items: Judgment[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            title: typeof data.title === "string" ? data.title : "",
            text: typeof data.text === "string" ? data.text : "",
            access: data.access === "paid" ? "paid" : "free",
            active:
              typeof data.active === "boolean"
                ? data.active
                : typeof data.isActive === "boolean"
                  ? data.isActive
                  : data.status === "inactive"
                    ? false
                    : true,
          };
        });

        items.sort((a, b) => a.title.localeCompare(b.title));
        setJudgments(items);
        setPageError("");
      },
      (error) => {
        console.error("Load judgments failed:", error);
        setPageError(`Judgments load nahi hue: ${getErrorMessage(error)}`);
      }
    );

    return () => unsubscribe();
  }, [authorized]);

  function resetForm() {
    setTitle("");
    setJudgmentText("");
    setAccess("free");
    setEditingId(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");
    setMessage("");

    const cleanTitle = title.trim();
    const cleanText = judgmentText.trim();

    if (!cleanTitle || !cleanText) {
      setPageError("Judgment ka title aur complete text paste karein.");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setPageError("Aap login nahi hain. Dobara login karke try karein.");
      return;
    }

    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setPageError(
        `Wrong admin account: ${user.email ?? "email unavailable"}`
      );
      return;
    }

    setLoading(true);

    try {
      console.log("Saving judgment:", {
        email: user.email,
        emailVerified: user.emailVerified,
        projectId: db.app.options.projectId,
        collection: COLLECTION_NAME,
        editing: !!editingId,
      });

      // Refresh the user's Firebase ID token before the write.
      await user.getIdToken(true);

      if (editingId) {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), {
          title: cleanTitle,
          text: cleanText,
          access,
          updatedAt: serverTimestamp(),
        });

        setMessage("Judgment successfully update ho gaya.");
      } else {
        await addDoc(collection(db, COLLECTION_NAME), {
          title: cleanTitle,
          text: cleanText,
          access,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setMessage("Judgment successfully save ho gaya.");
      }

      resetForm();
    } catch (error: unknown) {
      console.error("Save judgment failed:", error);
      setPageError(`Save failed: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(judgment: Judgment) {
    setEditingId(judgment.id);
    setTitle(judgment.title);
    setJudgmentText(judgment.text);
    setAccess(judgment.access);
    setPageError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleToggleActive(judgment: Judgment) {
    setPageError("");
    setMessage("");

    try {
      await updateDoc(doc(db, COLLECTION_NAME, judgment.id), {
        active: !judgment.active,
        updatedAt: serverTimestamp(),
      });

      setMessage(
        judgment.active
          ? "Judgment inactive kar diya gaya."
          : "Judgment active kar diya gaya."
      );
    } catch (error: unknown) {
      console.error("Update status failed:", error);
      setPageError(`Status update failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleDelete(judgment: Judgment) {
    const confirmed = window.confirm(
      `"${judgment.title}" ko permanently delete karna hai?`
    );

    if (!confirmed) return;

    setPageError("");
    setMessage("");

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, judgment.id));

      if (editingId === judgment.id) {
        resetForm();
      }

      setMessage("Judgment successfully delete ho gaya.");
    } catch (error: unknown) {
      console.error("Delete judgment failed:", error);
      setPageError(`Delete failed: ${getErrorMessage(error)}`);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <p className="font-semibold text-slate-700">
          Admin access check ho raha hai...
        </p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Access Required
          </h1>
          <p className="mt-3 text-slate-600">
            Authorized admin account se login karein.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  const activeCount = judgments.filter((item) => item.active).length;
  const freeCount = judgments.filter((item) => item.access === "free").length;
  const paidCount = judgments.filter((item) => item.access === "paid").length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-indigo-600">
              STENOCHECKER.IN
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Allahabad High Court
            </h1>
            <p className="mt-2 text-slate-600">
              APS / PS Judgment Typing — Admin Library
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Admin Dashboard
          </button>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total judgments</p>
            <p className="mt-1 text-3xl font-extrabold text-indigo-700">
              {judgments.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active judgments</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">
              {activeCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Free / Paid</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {freeCount} / {paidCount}
            </p>
          </div>
        </section>

        {pageError && (
          <div
            role="alert"
            className="mb-5 whitespace-pre-wrap break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
          >
            {pageError}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingId ? "Edit Judgment" : "Add New Judgment"}
          </h2>
          <p className="mb-6 mt-2 text-sm leading-6 text-slate-600">
            Judgment ka title likhein aur original judgment ka complete text
            copy-paste karein. Save karne par yeh library mein add hoga.
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label
                htmlFor="judgment-title"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Judgment Title
              </label>
              <input
                id="judgment-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Allahabad High Court Judgment 001"
                maxLength={180}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="judgment-text"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Complete Judgment Text
              </label>
              <textarea
                id="judgment-text"
                value={judgmentText}
                onChange={(event) => setJudgmentText(event.target.value)}
                placeholder="Actual judgment text yahan paste karein..."
                required
                spellCheck
                className="min-h-[350px] w-full resize-y rounded-xl border border-slate-300 px-4 py-4 font-serif text-base leading-7 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
                <span>Paragraphs aur punctuation check karein.</span>
                <span>
                  {judgmentText.trim()
                    ? judgmentText.trim().split(/\s+/).length
                    : 0}{" "}
                  words
                </span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold text-slate-700">
                Candidate Access
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    access === "free"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="access"
                    value="free"
                    checked={access === "free"}
                    onChange={() => setAccess("free")}
                  />
                  <span>
                    <span className="block font-bold text-emerald-800">
                      Free
                    </span>
                    <span className="text-sm text-slate-600">
                      Free practice category
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    access === "paid"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="access"
                    value="paid"
                    checked={access === "paid"}
                    onChange={() => setAccess("paid")}
                  />
                  <span>
                    <span className="block font-bold text-amber-800">
                      Paid
                    </span>
                    <span className="text-sm text-slate-600">
                      Paid category
                    </span>
                  </span>
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Paid access ka actual lock subscription/payment system se
                connect karne ke baad enforce hoga.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update Judgment"
                    : "Save Judgment"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Judgment Library
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Saved judgments yahan manage karein.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
              {judgments.length} total
            </span>
          </div>

          {judgments.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 px-5 py-12 text-center">
              <h3 className="text-lg font-bold text-slate-800">
                Abhi koi judgment nahi hai
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Upar actual judgment paste karke Save Judgment dabayein.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {judgments.map((judgment, index) => (
                <article
                  key={judgment.id}
                  className="rounded-2xl border border-slate-200 p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          #{index + 1}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            judgment.access === "free"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {judgment.access.toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            judgment.active
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {judgment.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <h3 className="break-words text-lg font-bold text-slate-900">
                        {judgment.title || "Untitled Judgment"}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {judgment.text
                          ? `${judgment.text.trim().split(/\s+/).length} words`
                          : "No text added"}
                      </p>
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {judgment.text.slice(0, 220)}
                        {judgment.text.length > 220 ? "..." : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(judgment)}
                        className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(judgment)}
                        className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50"
                      >
                        {judgment.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(judgment)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
