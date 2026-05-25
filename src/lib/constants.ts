export const STORAGE_KEYS = {
  tags: "quran:tags",
  notes: "quran:notes",
  theme: "quran:theme",
} as const;

export const DATA_URLS = {
  surahIndex: "/data/index.json",
  searchIndex: "/data/search-index.json",
  surah: (id: number) => `/data/surah-${id}.json`,
} as const;

export const SCROLL_TRIGGER_PX = 220;

export const QUERY_ROOTS_LIMIT = 12;
