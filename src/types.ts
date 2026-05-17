export interface Word {
  ar: string;
  tr?: string;
  root: string | null;
  lemma: string;
}

export interface Verse {
  id: string;
  surah: number;
  ayah: number;
  surahName?: string; // Arabic surah name (legacy)
  arabic: string;
  words: Word[];
}

export interface SurahMeta {
  id: number;
  name: string;
  totalVerses: number;
}

export interface SurahData extends SurahMeta {
  verses: Verse[];
}
