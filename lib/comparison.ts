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

export function normalizeText(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function comparePassages(
  masterText: string,
  typedText: string
): ComparisonItem[] {
  const masterWords = normalizeText(masterText);
  const typedWords = normalizeText(typedText);

  const results: ComparisonItem[] = [];

  const maxLength = Math.max(masterWords.length, typedWords.length);

  for (let i = 0; i < maxLength; i++) {
    const masterWord = masterWords[i];
    const typedWord = typedWords[i];

    if (masterWord && typedWord) {
      if (
        masterWord.toLowerCase() === typedWord.toLowerCase()
      ) {
        results.push({
          type: "correct",
          masterWord,
          typedWord,
          position: i,
        });
      } else {
        results.push({
          type: "wrong",
          masterWord,
          typedWord,
          position: i,
        });
      }
    } else if (masterWord && !typedWord) {
      results.push({
        type: "missing",
        masterWord,
        position: i,
      });
    } else if (!masterWord && typedWord) {
      results.push({
        type: "extra",
        typedWord,
        position: i,
      });
    }
  }

  return results;
}