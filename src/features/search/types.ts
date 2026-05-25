export interface SearchEntry {
  id: string;
  surah: number;
  ayah: number;
  name: string;
  arabic: string;
  roots: string[];
  wordRoots: (string | null)[];
}

export interface RootReturnTarget {
  surahId: number;
  verseId: string;
  wordIdx: number | null;
}
