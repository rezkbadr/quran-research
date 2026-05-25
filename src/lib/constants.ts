export const STORAGE_KEYS = {
  tags: "quran:tags",
  notes: "quran:notes",
  theme: "quran:theme",
  verseFontSize: "quran:verseFontSize",
} as const;

/** Stepped font sizes (px) for the verse text. The middle entry is the default. */
export const VERSE_FONT_SIZES = [22, 26, 32, 38, 44] as const;
export const DEFAULT_VERSE_FONT_SIZE_INDEX = 2;

export const DATA_URLS = {
  surahIndex: "/data/index.json",
  searchIndex: "/data/search-index.json",
  surah: (id: number) => `/data/surah-${id}.json`,
} as const;

export const SCROLL_TRIGGER_PX = 220;

export const QUERY_ROOTS_LIMIT = 12;

/** Debounce delay between keystrokes before the search runs. */
export const SEARCH_DEBOUNCE_MS = 500;
