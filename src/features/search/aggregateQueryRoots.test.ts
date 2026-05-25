import { describe, expect, it } from "vitest";
import type { SearchEntry } from "./types";
import { aggregateQueryRoots } from "./aggregateQueryRoots";

const SEARCH_INDEX: SearchEntry[] = [
  {
    id: "1:1", surah: 1, ayah: 1, name: "الفاتحة",
    arabic: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    roots: ["س م و", "ا ل ه", "ر ح م"],
    wordRoots: ["س م و", "ا ل ه", "ر ح م", "ر ح م"],
  },
  {
    id: "1:2", surah: 1, ayah: 2, name: "الفاتحة",
    arabic: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
    roots: ["ح م د", "ا ل ه", "ر ب ب", "ع ل م"],
    wordRoots: ["ح م د", "ا ل ه", "ر ب ب", "ع ل م"],
  },
];

describe("aggregateQueryRoots", () => {
  it("returns empty for an empty query", () => {
    expect(aggregateQueryRoots("", SEARCH_INDEX)).toEqual([]);
  });

  it("returns empty when the query is shorter than the min term length", () => {
    expect(aggregateQueryRoots("ا", SEARCH_INDEX)).toEqual([]);
  });

  it("returns empty when the search index is empty", () => {
    expect(aggregateQueryRoots("الله", [])).toEqual([]);
  });

  it("finds the root of a single matching keyword (normalization-aware)", () => {
    // User types plain alef; corpus has alef wasla. Should still match.
    const result = aggregateQueryRoots("الله", SEARCH_INDEX);
    const roots = result.map(([r]) => r);
    expect(roots).toContain("ا ل ه");
  });

  it("counts each matching word occurrence", () => {
    // 'الرحمن' and 'الرحيم' both share root 'ر ح م' in the basmala.
    const result = aggregateQueryRoots("رحمن", SEARCH_INDEX);
    const rh = result.find(([r]) => r === "ر ح م");
    expect(rh?.[1]).toBe(1);
  });

  it("ranks roots by total matching-word occurrences", () => {
    // The token 'الله' (plain alef, no contraction) appears once in the index,
    // at 1:1 — 1:2's 'لِلَّه' normalizes to 'لله' which does NOT contain 'الله'
    // as a substring. So the root 'ا ل ه' is seen once.
    const result = aggregateQueryRoots("الله", SEARCH_INDEX);
    expect(result[0][0]).toBe("ا ل ه");
    expect(result[0][1]).toBe(1);
  });

  it("collects roots across all terms (OR across terms, dedup by root key)", () => {
    const result = aggregateQueryRoots("الحمد الرحمن", SEARCH_INDEX);
    const roots = result.map(([r]) => r);
    expect(roots).toContain("ح م د");
    expect(roots).toContain("ر ح م");
  });

  it("ignores words without a root", () => {
    const corpusWithStopwords: SearchEntry[] = [
      {
        id: "x:1", surah: 9, ayah: 9, name: "—",
        arabic: "هُوَ هُوَ",
        roots: [],
        wordRoots: [null, null],
      },
    ];
    expect(aggregateQueryRoots("هو", corpusWithStopwords)).toEqual([]);
  });
});
