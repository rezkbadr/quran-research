export interface Word {
  ar: string;
  tr: string;
  root: string | null;
  lemma: string;
}

export interface Verse {
  id: string;
  surah: number;
  ayah: number;
  surahName: string; // Arabic surah name
  arabic: string;
  words: Word[];
}
