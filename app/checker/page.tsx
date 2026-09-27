"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Screen = "start" | "passage" | "exam" | "typing" | "result";
type Method = "exams" | "manual";
type MistakeWeight = "full" | "half";
type ExamType =
  | "SSC Stenographer Grade C & D Skill Test"
  | "Allahabad High Court Skill Test"
  | "Delhi High Court Skill Test"
  | "DSSSB Skill Test"
  | "Supreme Court Skill Test"
  | "CSIR Skill Test";

type MistakeType =
  | "wrong"
  | "missing"
  | "extra"
  | "spelling"
  | "capitalization"
  | "punctuation";

type HighlightItem = {
  type: MistakeType | "correct";
  word: string;
  correctWord?: string;
  index: number;
};

type Rules = {
  spelling: MistakeWeight;
  capitalization: MistakeWeight;
  punctuation: MistakeWeight;
};

type AnalysisResult = {
  masterWords: number;
  typedWords: number;
  wrongWords: number;
  missingWords: number;
  extraWords: number;
  spellingMistakes: number;
  capitalizationMistakes: number;
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

const examOptions: ExamType[] = [
  "SSC Stenographer Grade C & D Skill Test",
  "Allahabad High Court Skill Test",
  "Delhi High Court Skill Test",
  "DSSSB Skill Test",
  "Supreme Court Skill Test",
  "CSIR Skill Test",
];

const speedOptions = [70, 80, 90, 100, 110, 120, 130, 140, 150, 160];

const emptyResult: AnalysisResult = {
  masterWords: 0,
  typedWords: 0,
  wrongWords: 0,
  missingWords: 0,
  extraWords: 0,
  spellingMistakes: 0,
  capitalizationMistakes: 0,
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

const DEFAULT_RULES: Rules = {
  spelling: "half",
  capitalization: "half",
  punctuation: "half",
};

/*
 * These are common spelling variants where British and American English
 * use different spellings. They are intentionally treated as equivalent.
 */
const spellingEquivalents: Record<string, string> = {
  colour: "color",
  colours: "colors",
  honour: "honor",
  honoured: "honored",
  honouring: "honoring",
  honourable: "honorable",
  behaviour: "behavior",
  behaviours: "behaviors",
  favour: "favor",
  favoured: "favored",
  favourite: "favorite",
  favourites: "favorites",
  labour: "labor",
  labelled: "labeled",
  labelling: "labeling",
  travelled: "traveled",
  travelling: "traveling",
  cancelled: "canceled",
  counselling: "counseling",
  counsellor: "counselor",
  defence: "defense",
  offence: "offense",
  licence: "license",
  practise: "practice",
  organisation: "organization",
  organisations: "organizations",
  recognise: "recognize",
  recognised: "recognized",
  realise: "realize",
  realised: "realized",
  analyse: "analyze",
  analysed: "analyzed",
  centre: "center",
  metre: "meter",
  programme: "program",
  catalogue: "catalog",
  dialogue: "dialog",
};

/*
 * Common shorthand / formal variants. They are accepted as the same word
 * for checking purposes, e.g. Hon., Hon'ble and Honourable.
 */
const shortFormGroups = [
  ["hon", "honble", "honourable", "honorable"],
  ["dept", "department"],
  ["govt", "government"],
  ["gov", "government"],
  ["approx", "approximately"],
  ["no", "number"],
  ["nos", "numbers"],
  ["misc", "miscellaneous"],
  ["etc", "etcetera"],
  ["ie", "i.e"],
  ["eg", "e.g"],
];

function getWords(text: string): string[] {
  return text.trim() ? text.trim().split(/\s+/) : [];
}

function getDurationOptions(exam: ExamType | ""): number[] {
  if (exam === "SSC Stenographer Grade C & D Skill Test") {
    return [40, 50];
  }
  /*
   * Other examinations are kept selectable rather than assigning an
   * unverified official duration. The user can choose the duration shown
   * by the application for that test.
   */
  return [10, 20, 30, 40, 50, 60];
}

function getDefaultDuration(exam: ExamType | ""): number {
  if (exam === "SSC Stenographer Grade C & D Skill Test") return 40;
  return 10;
}

function canonicalWord(word: string): string {
  let value = word
    .toLowerCase()
    .replace(/[.,!?;:"“”‘’()[\]{}]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/-+/g, "")
    .replace(/\//g, "");

  value = value.replace(/['’]/g, "");

  if (spellingEquivalents[value]) {
    value = spellingEquivalents[value];
  }

  for (const group of shortFormGroups) {
    if (group.includes(value)) return group[0];
  }

  return value;
}

function wordLettersOnly(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"“”‘’()[\]{}]/g, "")
    .replace(/[-/]/g, "")
    .replace(/['’]/g, "");
}

function getPunctuation(word: string): string {
  const match = word.match(/[.,!?;:"“”‘’()[\]{}]+$/);
  return match ? match[0] : "";
}

function removePunctuation(word: string): string {
  return word.replace(/[.,!?;:"“”‘’()[\]{}]/g, "");
}

function isSameWord(masterWord: string, typedWord: string): boolean {
  return canonicalWord(masterWord) === canonicalWord(typedWord);
}

function isCapitalizationDifference(masterWord: string, typedWord: string): boolean {
  const a = wordLettersOnly(masterWord);
  const b = wordLettersOnly(typedWord);
  return !!a && a === b && masterWord !== typedWord;
}

function isSpellingDifference(masterWord: string, typedWord: string): boolean {
  const a = canonicalWord(masterWord);
  const b = canonicalWord(typedWord);

  if (!a || !b || a === b) return false;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);

  return distance <= 2 || (maxLength >= 5 && distance <= 3);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}

function addWeightedMistake(
  kind: "full" | "half",
  counters: { fullMistakes: number; halfMistakes: number }
) {
  if (kind === "full") counters.fullMistakes++;
  else counters.halfMistakes++;
}

function analyzePassages(
  master: string[],
  typed: string[],
  rules: Rules
) {
  const highlights: HighlightItem[] = [];
  let wrongWords = 0;
  let missingWords = 0;
  let extraWords = 0;
  let spellingMistakes = 0;
  let capitalizationMistakes = 0;
  let punctuationMistakes = 0;
  let fullMistakes = 0;
  let halfMistakes = 0;

  const counters = { fullMistakes, halfMistakes };

  let i = 0;
  let j = 0;

  while (i < master.length || j < typed.length) {
    const masterWord = master[i];
    const typedWord = typed[j];

    if (masterWord === undefined && typedWord !== undefined) {
      extraWords++;
      counters.fullMistakes++;
      highlights.push({
        type: "extra",
        word: typedWord,
        index: j,
      });
      j++;
      continue;
    }

    if (typedWord === undefined && masterWord !== undefined) {
      missingWords++;
      counters.fullMistakes++;
      highlights.push({
        type: "missing",
        word: `[${masterWord}]`,
        correctWord: masterWord,
        index: j,
      });
      i++;
      continue;
    }

    if (!masterWord || !typedWord) {
      i++;
      j++;
      continue;
    }

    if (isSameWord(masterWord, typedWord)) {
      const capDifference = isCapitalizationDifference(masterWord, typedWord);
      const masterPunctuation = getPunctuation(masterWord);
      const typedPunctuation = getPunctuation(typedWord);
      const punctuationDifference = masterPunctuation !== typedPunctuation;

      if (capDifference) {
        capitalizationMistakes++;
        addWeightedMistake(rules.capitalization, counters);
        highlights.push({
          type: "capitalization",
          word: typedWord,
          correctWord: masterWord,
          index: j,
        });
      } else if (punctuationDifference && !isIgnorablePunctuationDifference(masterPunctuation, typedPunctuation)) {
        punctuationMistakes++;
        addWeightedMistake(rules.punctuation, counters);
        highlights.push({
          type: "punctuation",
          word: typedWord,
          correctWord: masterWord,
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

    if (isSpellingDifference(masterWord, typedWord)) {
      spellingMistakes++;
      addWeightedMistake(rules.spelling, counters);
      highlights.push({
        type: "spelling",
        word: typedWord,
        correctWord: masterWord,
        index: j,
      });
      i++;
      j++;
      continue;
    }

    /*
     * If the next typed word matches the current master word, current typed
     * word is an extra word.
     */
    if (
      typed[j + 1] !== undefined &&
      isSameWord(masterWord, typed[j + 1])
    ) {
      extraWords++;
      counters.fullMistakes++;
      highlights.push({
        type: "extra",
        word: typedWord,
        index: j,
      });
      j++;
      continue;
    }

    /*
     * If the next master word matches the current typed word, current master
     * word is missing.
     */
    if (
      master[i + 1] !== undefined &&
      isSameWord(master[i + 1], typedWord)
    ) {
      missingWords++;
      counters.fullMistakes++;
      highlights.push({
        type: "missing",
        word: `[${masterWord}]`,
        correctWord: masterWord,
        index: j,
      });
      i++;
      continue;
    }

    wrongWords++;
    counters.fullMistakes++;
    highlights.push({
      type: "wrong",
      word: typedWord,
      correctWord: masterWord,
      index: j,
    });

    i++;
    j++;
  }

  const totalMistakes =
    wrongWords +
    missingWords +
    extraWords +
    spellingMistakes +
    capitalizationMistakes +
    punctuationMistakes;

  return {
    wrongWords,
    missingWords,
    extraWords,
    spellingMistakes,
    capitalizationMistakes,
    punctuationMistakes,
    fullMistakes: counters.fullMistakes,
    halfMistakes: counters.halfMistakes,
    totalMistakes,
    highlights,
  };
}

/*
 * Hyphen and slash differences are deliberately ignored.
 * Examples:
 *   "court-order" vs "court order"
 *   "and/or" vs "and or"
 *
 * A punctuation mark itself is still checked when it is a real punctuation
 * difference such as a comma, full stop, question mark, etc.
 */
function isIgnorablePunctuationDifference(a: string, b: string): boolean {
  const clean = (value: string) => value.replace(/[-/]/g, "");
  return clean(a) === clean(b);
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getHighlightStyle(type: MistakeType | "correct"): string {
  switch (type) {
    case "wrong":
      return "bg-red-200 text-red-900";
    case "missing":
      return "bg-yellow-200 text-yellow-900";
    case "extra":
      return "bg-orange-200 text-orange-900";
    case "spelling":
      return "bg-purple-200 text-purple-900";
    case "capitalization":
      return "bg-pink-200 text-pink-900";
    case "punctuation":
      return "bg-blue-200 text-blue-900";
    default:
      return "";
  }
}

function getMistakeLabel(type: MistakeType | "correct"): string {
  switch (type) {
    case "wrong":
      return "Wrong word";
    case "missing":
      return "Missing word";
    case "extra":
      return "Extra word";
    case "spelling":
      return "Spelling mistake";
    case "capitalization":
      return "Capitalization mistake";
    case "punctuation":
      return "Punctuation mistake";
    default:
      return "";
  }
}

export default function CheckerPage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [masterPassage, setMasterPassage] = useState("");
  const [typedPassage, setTypedPassage] = useState("");

  const [method, setMethod] = useState<Method>("exams");
  const [exam, setExam] = useState<ExamType | "">("");

  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [duration, setDuration] = useState(40);
  const [speed, setSpeed] = useState(100);

  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<AnalysisResult>(emptyResult);
  const [saving, setSaving] = useState(false);

  const masterWords = useMemo(() => getWords(masterPassage).length, [masterPassage]);

  const typedWords = useMemo(() => getWords(typedPassage).length, [typedPassage]);

  useEffect(() => {
    if (screen !== "typing" || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimeout(() => finishTest(), 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, timeLeft]);

  function handleExamChange(value: ExamType) {
    setExam(value);
    const newDuration = getDefaultDuration(value);
    setDuration(newDuration);
  }

  function startTest() {
    if (!masterPassage.trim()) return;
    if (method === "exams" && !exam) return;

    setTypedPassage("");
    setTimeLeft(duration * 60);
    setStartedAt(Date.now());
    setScreen("typing");
  }

  async function finishTest() {
    if (saving) return;

    const master = getWords(masterPassage);
    const typed = getWords(typedPassage);

    const analysis = analyzePassages(master, typed, rules);
    const endTime = Date.now();

    const elapsedSeconds = startedAt
      ? Math.max(
          1,
          Math.min(duration * 60, Math.floor((endTime - startedAt) / 1000))
        )
      : 1;

    const elapsedMinutes = elapsedSeconds / 60;
    const calculatedWpm =
      elapsedMinutes > 0 ? Math.round(typed.length / elapsedMinutes) : 0;

    const weightedMistakes =
      analysis.fullMistakes + analysis.halfMistakes * 0.5;

    const accuracy =
      master.length > 0
        ? Math.max(
            0,
            Math.min(100, 100 - (weightedMistakes / master.length) * 100)
          )
        : 0;

    const errorPercentage = Math.max(0, 100 - accuracy);

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

    const currentUser = auth.currentUser;

    if (currentUser) {
      setSaving(true);

      try {
        await addDoc(
          collection(db, "users", currentUser.uid, "tests"),
          {
            method,
            exam: exam || "Manual",
            duration,
            targetSpeed: speed,
            rules,
            masterPassage,
            typedPassage,
            ...analysis,
            masterWords: master.length,
            typedWords: typed.length,
            accuracy,
            errorPercentage,
            wpm: calculatedWpm,
            timeTaken: elapsedSeconds,
            createdAt: serverTimestamp(),
          }
        );
      } catch (error) {
        console.error("Error saving test:", error);
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
    setMethod("exams");
    setExam("");
    setRules(DEFAULT_RULES);
    setDuration(40);
    setSpeed(100);
    setTimeLeft(0);
    setStartedAt(null);
    setResult(emptyResult);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">StenoCheck</h1>
            <p className="text-sm text-slate-500">
              Stenography Practice & Analysis
            </p>
          </div>

          {screen !== "start" && (
            <div className="max-w-[55%] rounded-lg bg-blue-50 px-4 py-2 text-right text-sm font-semibold text-blue-700">
              {exam || "Manual Checking"}
            </div>
          )}
        </div>
      </header>

      {screen === "start" && (
        <StartScreen onStart={() => setScreen("passage")} />
      )}

      {screen === "passage" && (
        <PassageScreen
          masterPassage={masterPassage}
          setMasterPassage={setMasterPassage}
          wordCount={masterWords}
          onBack={() => setScreen("start")}
          onContinue={() => {
            if (masterPassage.trim()) setScreen("exam");
          }}
        />
      )}

      {screen === "exam" && (
        <ExamScreen
          method={method}
          setMethod={setMethod}
          exam={exam}
          setExam={handleExamChange}
          rules={rules}
          setRules={setRules}
          duration={duration}
          setDuration={setDuration}
          speed={speed}
          setSpeed={setSpeed}
          onBack={() => setScreen("passage")}
          onStart={startTest}
        />
      )}

      {screen === "typing" && (
        <TypingScreen
          exam={exam}
          duration={duration}
          speed={speed}
          timeLeft={timeLeft}
          typedPassage={typedPassage}
          setTypedPassage={setTypedPassage}
          onSubmit={finishTest}
        />
      )}

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

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-90px)] max-w-5xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-4xl">
          📝
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Steno Practice
        </p>

        <h2 className="mt-2 text-4xl font-bold">Check Your Own Passage</h2>

        <p className="mx-auto mt-4 max-w-2xl text-slate-500">
          Paste your original passage, choose an examination or manual checking
          rules, complete the test, and get a detailed mistake analysis.
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

function PassageScreen({
  masterPassage,
  setMasterPassage,
  wordCount,
  onBack,
  onContinue,
}: {
  masterPassage: string;
  setMasterPassage: (value: string) => void;
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
            <h3 className="text-lg font-bold">Master Passage</h3>
            <p className="mt-1 text-sm text-slate-500">
              Paste the complete original passage here.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {wordCount} words
          </span>
        </div>

        <textarea
          value={masterPassage}
          onChange={(e) => setMasterPassage(e.target.value)}
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

function ExamScreen({
  method,
  setMethod,
  exam,
  setExam,
  rules,
  setRules,
  duration,
  setDuration,
  speed,
  setSpeed,
  onBack,
  onStart,
}: {
  method: Method;
  setMethod: (value: Method) => void;
  exam: ExamType | "";
  setExam: (value: ExamType) => void;
  rules: Rules;
  setRules: (value: Rules) => void;
  duration: number;
  setDuration: (value: number) => void;
  speed: number;
  setSpeed: (value: number) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const durationOptions = getDurationOptions(exam);

  function updateRule(key: keyof Rules, value: MistakeWeight) {
    setRules({ ...rules, [key]: value });
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <StepHeader
        step="2"
        title="Choose Checking Method"
        description="Select By Exams for predefined examination checking or Manual to choose your own mistake rules."
      />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod("exams")}
            className={`rounded-xl border p-5 text-left ${
              method === "exams"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <p className="font-bold">By Exams</p>
            <p className="mt-1 text-sm text-slate-500">
              Use an examination-specific checking setup.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMethod("manual")}
            className={`rounded-xl border p-5 text-left ${
              method === "manual"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <p className="font-bold">Manual</p>
            <p className="mt-1 text-sm text-slate-500">
              Decide which mistakes count as full or half.
            </p>
          </button>
        </div>
      </div>

      {method === "exams" ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold text-slate-700">
              Select Your Exam
            </label>

            <select
              value={exam}
              onChange={(e) => setExam(e.target.value as ExamType)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Click to search/select exam</option>
              {examOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <RuleSummary exam={exam} rules={rules} />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Manual Mistake Settings</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose whether each selected mistake is counted as a full or half
            mistake.
          </p>

          <div className="mt-6 space-y-4">
            <ManualRuleRow
              title="1. Count Spelling Mistakes"
              value={rules.spelling}
              onChange={(value) => updateRule("spelling", value)}
            />

            <ManualRuleRow
              title="2. Count Capitalization Mistakes"
              value={rules.capitalization}
              onChange={(value) => updateRule("capitalization", value)}
            />

            <ManualRuleRow
              title="3. Count Punctuation Mistakes"
              value={rules.punctuation}
              onChange={(value) => updateRule("punctuation", value)}
            />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Time Duration</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select the time for this test.
          </p>

          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {durationOptions.map((value) => (
              <option key={value} value={value}>
                {value} minutes
              </option>
            ))}
          </select>

          {method === "exams" && exam === "SSC Stenographer Grade C & D Skill Test" && (
            <p className="mt-3 text-xs text-slate-500">
              Grade C: 40 minutes · Grade D: 50 minutes
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Target Speed</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select the target dictation/typing speed.
          </p>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {speedOptions.map((value) => (
              <option key={value} value={value}>
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
          disabled={method === "exams" && !exam}
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Test →
        </button>
      </div>
    </section>
  );
}

function RuleSummary({
  exam,
  rules,
}: {
  exam: ExamType | "";
  rules: Rules;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold">Checking Rules</h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <RuleBox
          title="Wrong / Missing / Extra Word"
          text="Counted as Full Mistake"
          color="red"
        />

        <RuleBox
          title="Spelling"
          text={`Counted as ${rules.spelling === "full" ? "Full" : "Half"} Mistake`}
          color="purple"
        />

        <RuleBox
          title="Capitalization"
          text={`Counted as ${rules.capitalization === "full" ? "Full" : "Half"} Mistake`}
          color="pink"
        />

        <RuleBox
          title="Punctuation"
          text={`Counted as ${rules.punctuation === "full" ? "Full" : "Half"} Mistake`}
          color="blue"
        />

        <RuleBox
          title="Hyphen / Slash"
          text="Hyphen (-) and slash (/) differences are not counted as mistakes"
          color="slate"
        />

        <RuleBox
          title="English Variants"
          text="British/American spellings and accepted short forms are treated as equivalent"
          color="green"
        />
      </div>

      {exam && (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          Selected exam: <strong>{exam}</strong>
        </p>
      )}
    </div>
  );
}

function ManualRuleRow({
  title,
  value,
  onChange,
}: {
  title: string;
  value: MistakeWeight;
  onChange: (value: MistakeWeight) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{title}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange("half")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              value === "half"
                ? "bg-yellow-500 text-white"
                : "border border-slate-200 bg-white"
            }`}
          >
            Half
          </button>

          <button
            type="button"
            onClick={() => onChange("full")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              value === "full"
                ? "bg-red-600 text-white"
                : "border border-slate-200 bg-white"
            }`}
          >
            Full
          </button>
        </div>
      </div>
    </div>
  );
}

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
  setTypedPassage: (value: string) => void;
  onSubmit: () => void;
}) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              {exam || "Manual Checking"}
            </p>
            <h2 className="mt-1 text-xl font-bold">Dictation Test</h2>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">Target Speed</p>
              <p className="font-bold">{speed} WPM</p>
            </div>

            <div
              className={`rounded-xl px-5 py-3 text-center ${
                timeLeft <= 60
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <p className="text-xs opacity-70">Time Left</p>
              <p className="font-mono text-xl font-bold">
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold">Type or Paste Your Transcription</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your master passage is hidden during the test.
          </p>
        </div>

        <textarea
          autoFocus
          value={typedPassage}
          onChange={(e) => setTypedPassage(e.target.value)}
          placeholder="Start typing or paste your transcription here..."
          className="h-[55vh] min-h-[400px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-5 text-base leading-8 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {getWords(typedPassage).length} words typed · {duration} minute test
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
          <h2 className="mt-1 text-3xl font-bold">Stenography Analysis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review your transcription and mistakes below.
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

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-8">
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
        <StatBox
          title="Master Words"
          value={result.masterWords.toString()}
          className="border-slate-200 bg-slate-50 text-slate-700"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-5 py-4">
            <div>
              <h3 className="text-xl font-bold text-blue-900">
                Your Typed Passage
              </h3>
              <p className="mt-1 text-xs text-blue-700">
                Correct word appears in brackets behind a wrong/spelling word.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              {result.typedWords} words
            </span>
          </div>

          <div className="p-6">
            <HighlightedPassage highlights={result.highlights} />

            {!typedPassage.trim() && (
              <p className="text-slate-400">No transcription entered.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-bold">Mistake Breakdown</h3>

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
              label="Capitalization"
              value={result.capitalizationMistakes}
              className="bg-pink-50 text-pink-700"
              dotClass="bg-pink-500"
            />
            <BreakdownRow
              label="Punctuation"
              value={result.punctuationMistakes}
              className="bg-blue-50 text-blue-700"
              dotClass="bg-blue-500"
            />
          </div>

          <div className="my-5 border-t border-slate-200" />

          <h4 className="font-bold">Additional Stats</h4>

          <div className="mt-4 space-y-4">
            <InfoRow label="Time Taken" value={formatTime(result.timeTaken)} />
            <InfoRow label="Typing Speed" value={`${result.wpm} WPM`} />
            <InfoRow label="Accuracy" value={`${result.accuracy.toFixed(1)}%`} />
            <InfoRow
              label="Error Percentage"
              value={`${result.errorPercentage.toFixed(1)}%`}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-4 font-bold">Highlight Legend</h4>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <LegendItem color="bg-red-300" label="Wrong Word" />
          <LegendItem color="bg-yellow-300" label="Missing Word" />
          <LegendItem color="bg-orange-300" label="Extra Word" />
          <LegendItem color="bg-purple-300" label="Spelling" />
          <LegendItem color="bg-pink-300" label="Capitalization" />
          <LegendItem color="bg-blue-300" label="Punctuation" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-4">
          <h3 className="text-xl font-bold text-emerald-900">
            Master / Actual Passage
          </h3>
          <p className="mt-1 text-xs text-emerald-700">
            Original passage used for comparison
          </p>
        </div>

        <div className="whitespace-pre-wrap p-6 text-base leading-8 text-slate-800">
          {masterPassage || "No master passage."}
        </div>
      </div>
    </section>
  );
}

function HighlightedPassage({
  highlights,
}: {
  highlights: HighlightItem[];
}) {
  return (
    <div className="whitespace-pre-wrap text-base leading-10 text-slate-900">
      {highlights.map((item, index) => {
        if (item.type === "correct") {
          return (
            <span key={index}>
              {item.word}{" "}
            </span>
          );
        }

        const style = getHighlightStyle(item.type);

        return (
          <span
            key={index}
            className={`mx-[2px] inline rounded px-1.5 py-0.5 font-medium ${style}`}
            title={
              item.correctWord
                ? `Correct word: ${item.correctWord}`
                : getMistakeLabel(item.type)
            }
          >
            {item.word}
            {item.correctWord && item.type !== "missing"
              ? ` (${item.correctWord})`
              : ""}{" "}
          </span>
        );
      })}
    </div>
  );
}

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
    | "pink"
    | "blue"
    | "slate"
    | "green";
}) {
  const styles = {
    red: "border-red-200 bg-red-50",
    yellow: "border-yellow-200 bg-yellow-50",
    orange: "border-orange-200 bg-orange-50",
    purple: "border-purple-200 bg-purple-50",
    pink: "border-pink-200 bg-pink-50",
    blue: "border-blue-200 bg-blue-50",
    slate: "border-slate-200 bg-slate-50",
    green: "border-emerald-200 bg-emerald-50",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[color]}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  );
}

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
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className="text-xs font-semibold opacity-80">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

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
        <span className={`h-3 w-3 rounded-full ${dotClass}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-4 w-4 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

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
        <p className="text-sm font-semibold text-blue-600">STEP {step}</p>
      </div>

      <h2 className="mt-4 text-3xl font-bold">{title}</h2>
      <p className="mt-2 max-w-2xl text-slate-500">{description}</p>
    </div>
  );
}