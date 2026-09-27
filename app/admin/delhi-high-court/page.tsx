
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../lib/firebase";

type Difficulty = "easy" | "moderate" | "difficult";
type AccessType = "free" | "paid";

type Passage = {
  id: string;
  exam: string;
  difficulty: Difficulty;
  passageNumber: number;
  text: string;
  wordCount: number;
  access: AccessType;
  active: boolean;
};

const difficulties = [
  {
    id: "easy" as Difficulty,
    name: "Easy",
    description: "Basic typing passages for regular practice.",
  },
  {
    id: "moderate" as Difficulty,
    name: "Moderate",
    description: "Medium-level passages for serious practice.",
  },
  {
    id: "difficult" as Difficulty,
    name: "Difficult",
    description: "Advanced legal passages for exam-level practice.",
  },
];

function countWords(text: string) {
  const cleaned = text.trim();

  if (!cleaned) {
    return 0;
  }

  return cleaned.split(/\s+/).length;
}

export default function DelhiHighCourtAdmin() {
  const router = useRouter();

  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("easy");

  const [passages, setPassages] = useState<Passage[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [passageNumber, setPassageNumber] = useState(1);
  const [passageText, setPassageText] = useState("");
  const [access, setAccess] =
    useState<AccessType>("free");
  const [active, setActive] = useState(true);

  /*
   * LOAD PASSAGES FROM FIRESTORE
   */

  useEffect(() => {
    const passagesRef = collection(
      db,
      "passages"
    );

    const passagesQuery = query(
      passagesRef,
      orderBy("passageNumber", "asc")
    );

    const unsubscribe = onSnapshot(
      passagesQuery,
      (snapshot) => {
        const loaded: Passage[] = [];

        snapshot.forEach((item) => {
          const data = item.data();

          if (
            data.exam ===
              "Delhi High Court"
          ) {
            loaded.push({
              id: item.id,
              exam: data.exam,
              difficulty: data.difficulty,
              passageNumber:
                data.passageNumber,
              text: data.text || "",
              wordCount:
                data.wordCount || 0,
              access:
                data.access || "free",
              active:
                data.active ?? true,
            });
          }
        });

        setPassages(loaded);
        setLoading(false);
      },
      (error) => {
        console.error(
          "FIRESTORE LOAD ERROR:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * RESET FORM
   */

  function resetForm() {
    setEditingId(null);
    setPassageText("");
    setAccess("free");
    setActive(true);
    setPassageNumber(
      getNextPassageNumber()
    );
    setShowForm(false);
  }

  /*
   * GET NEXT PASSAGE NUMBER
   */

  function getNextPassageNumber() {
    const numbers = passages
      .filter(
        (item) =>
          item.difficulty ===
          selectedDifficulty
      )
      .map(
        (item) =>
          item.passageNumber
      );

    for (let i = 1; i <= 20; i++) {
      if (!numbers.includes(i)) {
        return i;
      }
    }

    return 20;
  }

  /*
   * OPEN ADD FORM
   */

  function openAddForm() {
    setEditingId(null);
    setPassageNumber(
      getNextPassageNumber()
    );
    setPassageText("");
    setAccess("free");
    setActive(true);
    setShowForm(true);
  }

  /*
   * OPEN EDIT FORM
   */

  function openEditForm(
    passage: Passage
  ) {
    setEditingId(passage.id);
    setPassageNumber(
      passage.passageNumber
    );
    setPassageText(passage.text);
    setAccess(passage.access);
    setActive(passage.active);
    setShowForm(true);
  }

  /*
   * SAVE PASSAGE
   */

  async function savePassage() {
    if (!passageText.trim()) {
      alert(
        "Please enter passage text."
      );
      return;
    }

    if (
      passageNumber < 1 ||
      passageNumber > 20
    ) {
      alert(
        "Passage number must be between 1 and 20."
      );
      return;
    }

    const duplicate = passages.find(
      (item) =>
        item.difficulty ===
          selectedDifficulty &&
        item.passageNumber ===
          passageNumber &&
        item.id !== editingId
    );

    if (duplicate) {
      alert(
        `Passage ${passageNumber} already exists in ${selectedDifficulty}.`
      );
      return;
    }

    setSaving(true);

    try {
      const wordCount =
        countWords(passageText);

      if (editingId) {
        const passageRef = doc(
          db,
          "passages",
          editingId
        );

        await updateDoc(
          passageRef,
          {
            exam: "Delhi High Court",
            difficulty:
              selectedDifficulty,
            passageNumber,
            text: passageText.trim(),
            wordCount,
            access,
            active,
            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        await addDoc(
          collection(
            db,
            "passages"
          ),
          {
            exam: "Delhi High Court",
            difficulty:
              selectedDifficulty,
            passageNumber,
            text: passageText.trim(),
            wordCount,
            access,
            active,
            createdAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp(),
          }
        );
      }

      resetForm();
    } catch (error) {
      console.error(
        "SAVE PASSAGE ERROR:",
        error
      );

      alert(
        "Could not save passage. Check Firebase Firestore settings and console error."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * DELETE PASSAGE
   */

  async function deletePassage(
    passage: Passage
  ) {
    const confirmed =
      window.confirm(
        `Delete Passage ${passage.passageNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "passages",
          passage.id
        )
      );
    } catch (error) {
      console.error(
        "DELETE PASSAGE ERROR:",
        error
      );

      alert(
        "Could not delete passage."
      );
    }
  }

  /*
   * TOGGLE ACTIVE
   */

  async function toggleActive(
    passage: Passage
  ) {
    try {
      await updateDoc(
        doc(
          db,
          "passages",
          passage.id
        ),
        {
          active: !passage.active,
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        "Could not update passage status."
      );
    }
  }

  const currentPassages =
    passages
      .filter(
        (item) =>
          item.difficulty ===
          selectedDifficulty
      )
      .sort(
        (a, b) =>
          a.passageNumber -
          b.passageNumber
      );

  const selectedDifficultyInfo =
    difficulties.find(
      (item) =>
        item.id ===
        selectedDifficulty
    );

  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
              SC
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                StenoCheck Admin
              </h1>

              <p className="text-xs text-slate-500">
                Delhi High Court
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              router.push("/admin")
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Dashboard
          </button>

        </div>

      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-5 py-8">

        <div className="mb-8">

          <p className="text-sm font-semibold text-blue-600">
            PASSAGE MANAGEMENT
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
            Delhi High Court
          </h2>

          <p className="mt-2 text-slate-500">
            Manage up to 20 passages for
            each difficulty level.
          </p>

        </div>

        {/* DIFFICULTY */}

        <div className="grid gap-5 md:grid-cols-3">

          {difficulties.map(
            (difficulty) => {

              const active =
                selectedDifficulty ===
                difficulty.id;

              const count =
                passages.filter(
                  (item) =>
                    item.difficulty ===
                    difficulty.id
                ).length;

              return (
                <button
                  key={difficulty.id}
                  type="button"
                  onClick={() => {
                    setSelectedDifficulty(
                      difficulty.id
                    );
                    setShowForm(false);
                  }}
                  className={`rounded-3xl border p-6 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200"
                      : "border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold ${
                        difficulty.id ===
                        "easy"
                          ? "bg-blue-100 text-blue-700"
                          : difficulty.id ===
                            "moderate"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {difficulty.id ===
                      "easy"
                        ? "E"
                        : difficulty.id ===
                          "moderate"
                        ? "M"
                        : "D"}
                    </div>

                    {active && (
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                        SELECTED
                      </span>
                    )}

                  </div>

                  <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                    {difficulty.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      difficulty.description
                    }
                  </p>

                  <div className="mt-5 text-sm font-bold text-slate-700">
                    {count} / 20 Passages
                  </div>

                </button>
              );
            }
          )}

        </div>

        {/* SELECTED SECTION */}

        <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-blue-600">
                SELECTED DIFFICULTY
              </p>

              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {
                  selectedDifficultyInfo?.name
                }{" "}
                Passages
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {
                  currentPassages.length
                }{" "}
                of 20 passages added
              </p>

            </div>

            {currentPassages.length <
              20 && (
              <button
                type="button"
                onClick={openAddForm}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700"
              >
                + Add Passage
              </button>
            )}

          </div>

          {/* FORM */}

          {showForm && (
            <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">

              <div className="flex items-center justify-between">

                <h3 className="text-xl font-extrabold text-slate-900">
                  {editingId
                    ? "Edit Passage"
                    : "Add Passage"}
                </h3>

                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>

              </div>

              {/* NUMBER */}

              <div className="mt-5">

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Passage Number
                </label>

                <select
                  value={
                    passageNumber
                  }
                  onChange={(e) =>
                    setPassageNumber(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  {Array.from(
                    {
                      length: 20,
                    },
                    (_, i) => (
                      <option
                        key={i + 1}
                        value={i + 1}
                      >
                        Passage{" "}
                        {i + 1}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* TEXT */}

              <div className="mt-5">

                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Passage Text
                </label>

                <textarea
                  value={
                    passageText
                  }
                  onChange={(e) =>
                    setPassageText(
                      e.target.value
                    )
                  }
                  placeholder="Paste or type the complete passage here..."
                  rows={12}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base leading-7 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>
                    Word count:{" "}
                    <strong>
                      {
                        countWords(
                          passageText
                        )
                      }
                    </strong>
                  </span>

                  <span>
                    {
                      passageText.length
                    }{" "}
                    characters
                  </span>
                </div>

              </div>

              {/* OPTIONS */}

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Access
                  </label>

                  <select
                    value={access}
                    onChange={(e) =>
                      setAccess(
                        e.target
                          .value as AccessType
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >

                    <option value="free">
                      Free
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Status
                  </label>

                  <select
                    value={
                      active
                        ? "active"
                        : "inactive"
                    }
                    onChange={(e) =>
                      setActive(
                        e.target
                          .value ===
                          "active"
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

              {/* SAVE */}

              <button
                type="button"
                onClick={savePassage}
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Passage"
                  : "Save Passage"}
              </button>

            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Loading passages...
            </div>
          )}

          {/* PASSAGE LIST */}

          {!loading && (
            <div className="mt-6 space-y-3">

              {currentPassages.length ===
                0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                  <p className="text-lg font-bold text-slate-700">
                    No passages added yet
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Add your first{" "}
                    {
                      selectedDifficultyInfo?.name
                    }{" "}
                    passage.
                  </p>

                </div>
              )}

              {currentPassages.map(
                (passage) => (
                  <div
                    key={passage.id}
                    className="rounded-2xl border bg-white p-5"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            Passage{" "}
                            {
                              passage.passageNumber
                            }
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              passage.access ===
                              "paid"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {passage.access ===
                            "paid"
                              ? "PAID"
                              : "FREE"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              passage.active
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {passage.active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>

                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                          {passage.text}
                        </p>

                        <p className="mt-2 text-xs font-semibold text-slate-400">
                          {
                            passage.wordCount
                          }{" "}
                          words
                        </p>

                      </div>

                      <div className="flex shrink-0 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              passage
                            )
                          }
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              passage
                            )
                          }
                          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
                        >
                          {passage.active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deletePassage(
                              passage
                            )
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

    </main>
  );
}
