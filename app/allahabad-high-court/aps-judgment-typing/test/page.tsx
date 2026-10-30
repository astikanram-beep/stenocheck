"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const TEST_MINUTES = 15;

const DEMO_JUDGMENT = `IN THE HIGH COURT OF JUDICATURE AT ALLAHABAD

ORDER

The present matter has been placed before this Court for consideration. Learned counsel for the parties have been heard. The record has been examined carefully, and the Court proceeds to pass the following order in accordance with law.

Having considered the facts and circumstances of the case, this Court is of the opinion that the matter requires consideration on its merits.

Accordingly, the matter shall be dealt with in accordance with law.`;

type AlignType = "left" | "center" | "right" | "justify";

export default function APSJudgmentTestPage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const masterRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [secondsLeft, setSecondsLeft] = useState(TEST_MINUTES * 60);
  const [passageTitle, setPassageTitle] = useState("Judgment Typing");
  const [started, setStarted] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("14");
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [alignment, setAlignment] = useState<AlignType>("left");
  const [wordCount, setWordCount] = useState(0);
  const [masterText] = useState(DEMO_JUDGMENT);

  useEffect(() => {
    try {
      const title = sessionStorage.getItem("apsSelectedPassageTitle");
      if (title) setPassageTitle(title);
    } catch {
      // Keep the default title if session storage is unavailable.
    }
  }, []);

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const updateWordCount = useCallback(() => {
    const text = editorRef.current?.innerText ?? "";
    const trimmed = text.trim();
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
  }, []);

  const submitTest = useCallback(() => {
    if (submitted) return;

    setSubmitted(true);
    setStarted(false);

    const typedText = editorRef.current?.innerText ?? "";
    const actualWordCount = typedText.trim()
      ? typedText.trim().split(/\s+/).length
      : 0;

    const attempt = {
      passageTitle,
      masterText,
      typedText,
      wordCount: actualWordCount,
      submittedAt: new Date().toISOString(),
      timeRemaining: secondsLeft,
      durationMinutes: TEST_MINUTES,
    };

    try {
      sessionStorage.setItem("apsJudgmentAttempt", JSON.stringify(attempt));
    } catch {
      // Continue to the existing result route.
    }

    router.push("/allahabad-high-court/aps-judgment-typing/result");
  }, [submitted, passageTitle, masterText, secondsLeft, router]);

  useEffect(() => {
    if (!started || submitted) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, submitted]);

  useEffect(() => {
    if (started && secondsLeft === 0 && !submitted) {
      submitTest();
    }
  }, [started, secondsLeft, submitted, submitTest]);

  function runCommand(command: string, value?: string) {
    if (!started || submitted) return;

    editorRef.current?.focus();

    try {
      document.execCommand(command, false, value);
    } catch {
      // Keep the editor usable if a browser command is unavailable.
    }

    updateActiveTools();
    updateWordCount();
  }

  function updateActiveTools() {
    const tools: string[] = [];

    try {
      if (document.queryCommandState("bold")) tools.push("bold");
      if (document.queryCommandState("italic")) tools.push("italic");
      if (document.queryCommandState("underline")) tools.push("underline");
      if (document.queryCommandState("insertUnorderedList")) {
        tools.push("bullet");
      }
      if (document.queryCommandState("insertOrderedList")) {
        tools.push("number");
      }
    } catch {
      // Some browser states may not be available.
    }

    setActiveTools(tools);

    try {
      if (document.queryCommandState("justifyLeft")) {
        setAlignment("left");
      } else if (document.queryCommandState("justifyCenter")) {
        setAlignment("center");
      } else if (document.queryCommandState("justifyRight")) {
        setAlignment("right");
      } else if (document.queryCommandState("justifyFull")) {
        setAlignment("justify");
      }
    } catch {
      // Keep the current alignment.
    }
  }

  function setAlignmentCommand(value: AlignType) {
    setAlignment(value);

    runCommand(
      value === "left"
        ? "justifyLeft"
        : value === "center"
          ? "justifyCenter"
          : value === "right"
            ? "justifyRight"
            : "justifyFull"
    );
  }

  function changeFontFamily(value: string) {
    setFontFamily(value);
    runCommand("fontName", value);
  }

  function changeFontSize(value: string) {
    setFontSize(value);

    const legacySize =
      Number(value) <= 10
        ? "2"
        : Number(value) <= 12
          ? "3"
          : Number(value) <= 16
            ? "4"
            : Number(value) <= 20
              ? "5"
              : Number(value) <= 28
                ? "6"
                : "7";

    runCommand("fontSize", legacySize);

    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) return;

    try {
      if (range.collapsed) {
        editor.focus();
        return;
      }

      const span = document.createElement("span");
      span.style.fontSize = `${value}pt`;

      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      selection.removeAllRanges();

      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection.addRange(nextRange);
    } catch {
      // Preserve text if the selection cannot be wrapped.
    }

    editor.focus();
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();

      if (key === "b" || key === "i" || key === "u") {
        event.preventDefault();

        runCommand(
          key === "b" ? "bold" : key === "i" ? "italic" : "underline"
        );
      } else if (
        key === "l" ||
        key === "e" ||
        key === "r" ||
        key === "j"
      ) {
        event.preventDefault();

        const next: AlignType =
          key === "l"
            ? "left"
            : key === "e"
              ? "center"
              : key === "r"
                ? "right"
                : "justify";

        setAlignmentCommand(next);
      } else if (key === "[" || key === "]") {
        event.preventDefault();

        const next = Math.max(
          8,
          Math.min(36, Number(fontSize) + (key === "]" ? 1 : -1))
        );

        changeFontSize(String(next));
      }
    }
  }

  function insertFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !started || submitted) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== "string") return;

        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();

        const image = document.createElement("img");
        image.src = reader.result;
        image.alt = file.name;
        image.style.maxWidth = "100%";
        image.style.height = "auto";

        const selection = window.getSelection();

        if (
          selection?.rangeCount &&
          editor.contains(selection.getRangeAt(0).commonAncestorContainer)
        ) {
          selection.getRangeAt(0).insertNode(image);
        } else {
          editor.appendChild(image);
        }

        updateWordCount();
      };

      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();

      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        editorRef.current?.focus();
        runCommand("insertText", text);
        updateWordCount();
      };

      reader.readAsText(file);
    }

    event.target.value = "";
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Could not change full screen mode:", error);
    }
  }

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function ToolButton({
    label,
    title,
    active,
    children,
    onClick,
  }: {
    label: string;
    title: string;
    active?: boolean;
    children: ReactNode;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={active}
        disabled={!started || submitted}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          active ? "bg-[#c5e4ff] text-sky-900" : "hover:bg-gray-300"
        }`}
      >
        {children}
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  function AlignmentIcon({ type }: { type: AlignType }) {
    const lines =
      type === "left"
        ? ["M3 5h18", "M3 9h18", "M3 13h14", "M3 17h18"]
        : type === "center"
          ? ["M3 5h18", "M6 9h12", "M4 13h16", "M6 17h12"]
          : type === "right"
            ? ["M3 5h18", "M6 9h15", "M3 13h18", "M6 17h15"]
            : ["M3 5h18", "M3 9h18", "M3 13h18", "M3 17h18"];

    return (
      <svg
        viewBox="0 0 24 22"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {lines.map((line, index) => (
          <path key={index} d={line} />
        ))}
      </svg>
    );
  }

  return (
    <main className="flex h-[100dvh] min-h-0 flex-col gap-2 overflow-hidden bg-white p-2 text-gray-900 sm:p-3">
      <header className="flex shrink-0 items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600">
          AHC PS Judgment Typing
        </span>
      </header>

      {/* Floating timer: it does not take up layout space */}
      <div
        className={`fixed right-4 top-4 z-50 rounded-lg border px-3 py-1 text-center shadow-lg ${
          secondsLeft <= 60
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-gray-300 bg-gray-100 text-gray-900"
        }`}
      >
        <div className="text-[10px] leading-3 text-gray-500">Time Left</div>
        <div className="text-lg font-semibold tabular-nums leading-6">
          {formatTime(secondsLeft)}
        </div>
      </div>

      {/* Master Passage: larger area */}
      <section className="flex min-h-0 flex-[1.2] flex-col overflow-hidden rounded-md border border-gray-300">
        <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold">
          Master Passage
        </div>

        <div
          ref={masterRef}
          className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-3 py-2 text-sm leading-6"
          style={{ fontFamily: "Arial, sans-serif", fontSize: "14pt" }}
        >
          {masterText}
        </div>
      </section>

      {/* Toolbar stays between Master Passage and Typing Area */}
      <section className="flex shrink-0 flex-col gap-1">
        <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-gray-400 bg-[#dedede] p-1">
          <select
            aria-label="Font style"
            title="Font style"
            value={fontFamily}
            disabled={!started || submitted}
            onChange={(event) => changeFontFamily(event.target.value)}
            className="h-8 max-w-[112px] rounded border border-gray-300 bg-white px-1.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-sky-400"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Calibri">Calibri</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
          </select>

          <select
            aria-label="Font size"
            title="Font size"
            value={fontSize}
            disabled={!started || submitted}
            onChange={(event) => changeFontSize(event.target.value)}
            className="h-8 w-[54px] rounded border border-gray-300 bg-white px-1 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-sky-400"
          >
            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36].map(
              (size) => (
                <option key={size} value={String(size)}>
                  {size}
                </option>
              )
            )}
          </select>

          <span className="mx-0.5 h-6 w-px bg-gray-400" />

          <ToolButton
            label="Bold"
            title="Bold (Ctrl+B)"
            active={activeTools.includes("bold")}
            onClick={() => runCommand("bold")}
          >
            <strong className="text-sm">B</strong>
          </ToolButton>

          <ToolButton
            label="Italic"
            title="Italic (Ctrl+I)"
            active={activeTools.includes("italic")}
            onClick={() => runCommand("italic")}
          >
            <em className="text-sm">I</em>
          </ToolButton>

          <ToolButton
            label="Underline"
            title="Underline (Ctrl+U)"
            active={activeTools.includes("underline")}
            onClick={() => runCommand("underline")}
          >
            <span className="text-sm underline underline-offset-2">U</span>
          </ToolButton>

          <span className="mx-0.5 h-6 w-px bg-gray-400" />

          {(
            [
              ["left", "Left align (Ctrl+L)"],
              ["center", "Center align (Ctrl+E)"],
              ["right", "Right align (Ctrl+R)"],
              ["justify", "Justify (Ctrl+J)"],
            ] as [AlignType, string][]
          ).map(([type, title]) => (
            <ToolButton
              key={type}
              label={type}
              title={title}
              active={alignment === type}
              onClick={() => setAlignmentCommand(type)}
            >
              <AlignmentIcon type={type} />
            </ToolButton>
          ))}

          <span className="mx-0.5 h-6 w-px bg-gray-400" />

          <ToolButton
            label="Bulleted list"
            title="Bulleted list"
            active={activeTools.includes("bullet")}
            onClick={() => runCommand("insertUnorderedList")}
          >
            <svg
              viewBox="0 0 22 22"
              width="19"
              height="19"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="4" cy="5" r="1.5" />
              <circle cx="4" cy="11" r="1.5" />
              <circle cx="4" cy="17" r="1.5" />
              <path d="M8 4h11v2H8zM8 10h11v2H8zM8 16h11v2H8z" />
            </svg>
          </ToolButton>

          <ToolButton
            label="Numbered list"
            title="Numbered list"
            active={activeTools.includes("number")}
            onClick={() => runCommand("insertOrderedList")}
          >
            <svg
              viewBox="0 0 22 22"
              width="19"
              height="19"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 4h11v2H8zM8 10h11v2H8zM8 16h11v2H8z" />
              <text x="1" y="6.5" fontSize="6">1.</text>
              <text x="1" y="12.5" fontSize="6">2.</text>
              <text x="1" y="18.5" fontSize="6">3.</text>
            </svg>
          </ToolButton>

          <span className="mx-0.5 h-6 w-px bg-gray-400" />

          <ToolButton
            label="Insert file"
            title="Insert text file or image"
            onClick={() => fileRef.current?.click()}
          >
            <svg
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 16V4m-4 4 4-4 4 4M5 14v5h14v-5" />
            </svg>
          </ToolButton>

          <input
            ref={fileRef}
            type="file"
            accept=".txt,.text,image/*"
            className="hidden"
            onChange={insertFile}
          />
        </div>
      </section>

      {/* Typing Area: smaller than Master Passage */}
      <section className="flex min-h-0 flex-[1] flex-col overflow-hidden rounded-md border border-gray-300">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-2 py-1">
          <span className="text-xs font-semibold">Typing Area</span>
          <span className="text-[11px] text-gray-500">
            Words: {wordCount}
          </span>
        </div>

        <div
          ref={editorRef}
          contentEditable={started && !submitted}
          suppressContentEditableWarning
          role="textbox"
          aria-label="Judgment typing area"
          aria-multiline="true"
          data-placeholder="Type the judgment here..."
          onInput={updateWordCount}
          onKeyDown={handleEditorKeyDown}
          onKeyUp={updateActiveTools}
          onMouseUp={updateActiveTools}
          onPaste={() => window.setTimeout(updateWordCount, 0)}
          className="typing-editor min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-3 py-2 leading-6 outline-none"
          style={{
            fontFamily,
            fontSize: `${fontSize}pt`,
            textAlign: alignment,
            overflowWrap: "anywhere",
          }}
        />
      </section>

      <footer className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-100"
        >
          {isFullScreen ? "Exit Full Screen" : "Full Screen"}
        </button>

        <button
          type="button"
          disabled={!started || submitted}
          onClick={() => {
            if (window.confirm("Submit your judgment typing test?")) {
              submitTest();
            }
          }}
          className="rounded-md bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Test
        </button>
      </footer>

      <style jsx>{`
        .typing-editor:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        .typing-editor img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </main>
  );
}