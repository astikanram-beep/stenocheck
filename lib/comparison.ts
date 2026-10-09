export type ComparisonType =
  | "correct"
  | "wrong"
  | "missing"
  | "extra";

export interface ComparisonItem {
  type: ComparisonType;
  masterWord?: string;
  typedWord?: string;
  position: number;
}

/**
 * Text ko words mein convert karta hai.
 * New line, paragraph aur multiple spaces ko same maana jayega.
 */
export function normalizeText(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Comparison ke liye word ka basic form.
 *
 * Example:
 *   "Important." -> "important"
 *   "IMPORTANT" -> "important"
 *   "Common,"   -> "common"
 *
 * Punctuation ko alignment se alag rakha jaata hai.
 */
function normalizeForComparison(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}]/g, "");
}

/**
 * Check karta hai ki ek typed word aur master word
 * practically same word hain ya nahi.
 */
function wordsMatch(master: string, typed: string): boolean {
  return normalizeForComparison(master) === normalizeForComparison(typed);
}

/**
 * Check karta hai ki typed word actually master ke
 * do words ko jod kar bana hua hai.
 *
 * Example:
 *   master: Common + man
 *   typed : Commonman
 */
function isMergedWord(
  master1: string,
  master2: string,
  typed: string
): boolean {
  const a = normalizeForComparison(master1);
  const b = normalizeForComparison(master2);
  const t = normalizeForComparison(typed);

  return a.length > 0 && b.length > 0 && a + b === t;
}

/**
 * Check karta hai ki master ka ek word typed ke
 * do words mein split ho gaya hai.
 *
 * Example:
 *   master: cannot
 *   typed : can not
 */
function isSplitWord(
  master: string,
  typed1: string,
  typed2: string
): boolean {
  const m = normalizeForComparison(master);
  const a = normalizeForComparison(typed1);
  const b = normalizeForComparison(typed2);

  return m.length > 0 && a.length > 0 && b.length > 0 && a + b === m;
}

/**
 * Sequence alignment based comparison.
 *
 * IMPORTANT:
 * Purane code ki tarah:
 *
 *   master[i] vs typed[i]
 *
 * nahi karta.
 *
 * Agar beech mein ek word missing / extra / merged / split ho,
 * to baaki passage automatically re-align hota hai.
 */
export function comparePassages(
  masterText: string,
  typedText: string
): ComparisonItem[] {
  const masterWords = normalizeText(masterText);
  const typedWords = normalizeText(typedText);

  const m = masterWords.length;
  const n = typedWords.length;

  /*
   * DP matrix.
   *
   * dp[i][j] = master ke first i words aur typed ke first j words
   * ko align karne ki minimum cost.
   */
  const dp: number[][] = Array.from(
    { length: m + 1 },
    () => Array(n + 1).fill(0)
  );

  /*
   * Backtracking action.
   */
  type Action =
    | "match"
    | "wrong"
    | "missing"
    | "extra"
    | "merged"
    | "split";

  const action: Action[][] = Array.from(
    { length: m + 1 },
    () => Array(n + 1).fill("wrong")
  );

  // Empty typed text => all master words missing
  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    action[i][0] = "missing";
  }

  // Empty master text => all typed words extra
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    action[0][j] = "extra";
  }

  /*
   * Cost system.
   *
   * Normal correct word = 0
   * Wrong word          = 1
   * Missing word        = 1
   * Extra word          = 1
   * Merged/Split        = 1
   *
   * Merged/split ko special treatment diya gaya hai
   * taaki ek mistake ke baad passage shift na ho.
   */
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const master = masterWords[i - 1];
      const typed = typedWords[j - 1];

      // 1. Exact / normalized match
      if (wordsMatch(master, typed)) {
        dp[i][j] = dp[i - 1][j - 1];
        action[i][j] = "match";
      } else {
        // 2. Normal wrong word
        let bestCost = dp[i - 1][j - 1] + 1;
        let bestAction: Action = "wrong";

        // 3. Missing master word
        const missingCost = dp[i - 1][j] + 1;

        if (missingCost < bestCost) {
          bestCost = missingCost;
          bestAction = "missing";
        }

        // 4. Extra typed word
        const extraCost = dp[i][j - 1] + 1;

        if (extraCost < bestCost) {
          bestCost = extraCost;
          bestAction = "extra";
        }

        // 5. MASTER = 2 words, TYPED = 1 merged word
        //
        // Example:
        // Master: Common man
        // Typed : Commonman
        //
        // Isko ek single alignment mistake maana jayega.
        if (
          i >= 2 &&
          isMergedWord(
            masterWords[i - 2],
            masterWords[i - 1],
            typed
          )
        ) {
          const mergedCost = dp[i - 2][j - 1] + 1;

          if (mergedCost <= bestCost) {
            bestCost = mergedCost;
            bestAction = "merged";
          }
        }

        // 6. MASTER = 1 word, TYPED = 2 split words
        //
        // Example:
        // Master: cannot
        // Typed : can not
        if (
          j >= 2 &&
          isSplitWord(
            master,
            typedWords[j - 2],
            typedWords[j - 1]
          )
        ) {
          const splitCost = dp[i - 1][j - 2] + 1;

          if (splitCost <= bestCost) {
            bestCost = splitCost;
            bestAction = "split";
          }
        }

        dp[i][j] = bestCost;
        action[i][j] = bestAction;
      }
    }
  }

  /*
   * Backtrack.
   */
  const reversed: ComparisonItem[] = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const currentAction = action[i][j];

    // Exact match
    if (currentAction === "match") {
      reversed.push({
        type: "correct",
        masterWord: masterWords[i - 1],
        typedWord: typedWords[j - 1],
        position: i - 1,
      });

      i--;
      j--;
      continue;
    }

    // Merged:
    // master has 2 words, typed has 1 word
    if (
      currentAction === "merged" &&
      i >= 2 &&
      j >= 1
    ) {
      reversed.push({
        type: "wrong",
        masterWord:
          masterWords[i - 2] + " " + masterWords[i - 1],
        typedWord: typedWords[j - 1],
        position: i - 2,
      });

      i -= 2;
      j -= 1;
      continue;
    }

    // Split:
    // master has 1 word, typed has 2 words
    if (
      currentAction === "split" &&
      i >= 1 &&
      j >= 2
    ) {
      reversed.push({
        type: "wrong",
        masterWord: masterWords[i - 1],
        typedWord:
          typedWords[j - 2] + " " + typedWords[j - 1],
        position: i - 1,
      });

      i -= 1;
      j -= 2;
      continue;
    }

    // Missing master word
    if (currentAction === "missing") {
      reversed.push({
        type: "missing",
        masterWord: masterWords[i - 1],
        position: i - 1,
      });

      i--;
      continue;
    }

    // Extra typed word
    if (currentAction === "extra") {
      reversed.push({
        type: "extra",
        typedWord: typedWords[j - 1],
        position: i,
      });

      j--;
      continue;
    }

    // Normal wrong word
    if (i > 0 && j > 0) {
      reversed.push({
        type: "wrong",
        masterWord: masterWords[i - 1],
        typedWord: typedWords[j - 1],
        position: i - 1,
      });

      i--;
      j--;
      continue;
    }

    // Safety fallback
    if (i > 0) {
      reversed.push({
        type: "missing",
        masterWord: masterWords[i - 1],
        position: i - 1,
      });

      i--;
    } else if (j > 0) {
      reversed.push({
        type: "extra",
        typedWord: typedWords[j - 1],
        position: i,
      });

      j--;
    }
  }

  return reversed.reverse();
}