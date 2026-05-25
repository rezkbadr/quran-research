import { describe, expect, it } from "vitest";
import type { SearchEntry } from "./types";
import type { Verse } from "../../types";
import { filterBrowseVerses, filterSearchIndex } from "./filterSearchIndex";

const SEARCH_INDEX: SearchEntry[] = [
  {
    id: "1:1",
    surah: 1, ayah: 1, name: "الفاتحة",
    arabic: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    roots: ["س م و", "ا ل ه", "ر ح م"],
    wordRoots: ["س م و", "ا ل ه", "ر ح م", "ر ح م"],
  },
  {
    id: "1:2",
    surah: 1, ayah: 2, name: "الفاتحة",
    arabic: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
    roots: ["ح م د", "ا ل ه", "ر ب ب", "ع ل م"],
    wordRoots: ["ح م د", "ا ل ه", "ر ب ب", "ع ل م"],
  },
  {
    id: "2:255",
    surah: 2, ayah: 255, name: "البقرة",
    arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ",
    roots: ["ا ل ه"],
    wordRoots: ["ا ل ه", null, "ا ل ه", null, null],
  },
];

describe("filterSearchIndex", () => {
  it("returns null when the index is empty", () => {
    expect(filterSearchIndex({ query: "بسم", activeRoot: null, searchIndex: [] })).toBeNull();
  });

  it("returns null when neither a query of length ≥2 nor a root is active", () => {
    expect(filterSearchIndex({ query: "", activeRoot: null, searchIndex: SEARCH_INDEX })).toBeNull();
    expect(filterSearchIndex({ query: "ا", activeRoot: null, searchIndex: SEARCH_INDEX })).toBeNull();
  });

  it("matches a single Arabic term ignoring diacritics and alef wasla (substring semantics)", () => {
    // User types plain alef in "الله". After normalization the index reads as
    // "بسم الله ...", "الحمد لله ...", "الله لا ...". Only verses where the
    // standalone token "الله" appears as a substring should match — the
    // contracted form "لله" (=li-llāh, "to Allah") shares the same root but
    // does not contain "الله" as a substring, so 1:2 correctly does not match.
    const results = filterSearchIndex({ query: "الله", activeRoot: null, searchIndex: SEARCH_INDEX });
    expect(results?.map(e => e.id)).toEqual(["1:1", "2:255"]);
  });

  it("matches multi-word queries by AND across normalized text", () => {
    const results = filterSearchIndex({ query: "بسم الله", activeRoot: null, searchIndex: SEARCH_INDEX });
    expect(results?.map(e => e.id)).toEqual(["1:1"]);
  });

  it("matches a verse reference query like '2:255'", () => {
    const results = filterSearchIndex({ query: "2:255", activeRoot: null, searchIndex: SEARCH_INDEX });
    expect(results?.map(e => e.id)).toEqual(["2:255"]);
  });

  it("treats a root-pattern query (e.g. 'ر ح م') as a root substring match", () => {
    const results = filterSearchIndex({ query: "ر ح م", activeRoot: null, searchIndex: SEARCH_INDEX });
    expect(results?.map(e => e.id)).toEqual(["1:1"]);
  });

  it("filters by active root alone (no query)", () => {
    const results = filterSearchIndex({ query: "", activeRoot: "ا ل ه", searchIndex: SEARCH_INDEX });
    expect(results?.map(e => e.id).sort()).toEqual(["1:1", "1:2", "2:255"]);
  });

  it("combines query and active root as an AND constraint", () => {
    const results = filterSearchIndex({ query: "الحمد", activeRoot: "ا ل ه", searchIndex: SEARCH_INDEX });
    expect(results?.map(e => e.id)).toEqual(["1:2"]);
  });

  it("returns an empty array when no entries match (but search mode IS active)", () => {
    const results = filterSearchIndex({ query: "nomatch", activeRoot: null, searchIndex: SEARCH_INDEX });
    expect(results).toEqual([]);
  });
});

describe("filterBrowseVerses", () => {
  const verses: Verse[] = [
    {
      id: "1:1", surah: 1, ayah: 1,
      arabic: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
      words: [
        { ar: "بِسۡمِ", root: "س م و", lemma: "اسم" },
        { ar: "ٱللَّهِ", root: "ا ل ه", lemma: "الله" },
        { ar: "ٱلرَّحۡمَٰنِ", root: "ر ح م", lemma: "رحمن" },
        { ar: "ٱلرَّحِيمِ", root: "ر ح م", lemma: "رحيم" },
      ],
    },
    {
      id: "1:2", surah: 1, ayah: 2,
      arabic: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
      words: [
        { ar: "ٱلۡحَمۡدُ", root: "ح م د", lemma: "حمد" },
        { ar: "لِلَّهِ", root: "ا ل ه", lemma: "الله" },
        { ar: "رَبِّ", root: "ر ب ب", lemma: "رب" },
        { ar: "ٱلۡعَٰلَمِينَ", root: "ع ل م", lemma: "عالم" },
      ],
    },
  ];

  it("returns an empty list when a query is active (handled by globalResults)", () => {
    expect(filterBrowseVerses({ query: "بسم", activeRoot: null, surahVerses: verses, activeTags: [], userTags: {} })).toEqual([]);
  });

  it("returns every verse when nothing is active", () => {
    expect(filterBrowseVerses({ query: "", activeRoot: null, surahVerses: verses, activeTags: [], userTags: {} })).toHaveLength(2);
  });

  it("keeps only verses that contain a word with the active root", () => {
    const out = filterBrowseVerses({ query: "", activeRoot: "ح م د", surahVerses: verses, activeTags: [], userTags: {} });
    expect(out.map(v => v.id)).toEqual(["1:2"]);
  });

  it("requires every active tag to be present (AND semantics)", () => {
    const userTags = { "1:1": ["dua", "names"], "1:2": ["dua"] };
    const out = filterBrowseVerses({ query: "", activeRoot: null, surahVerses: verses, activeTags: ["dua", "names"], userTags });
    expect(out.map(v => v.id)).toEqual(["1:1"]);
  });
});
