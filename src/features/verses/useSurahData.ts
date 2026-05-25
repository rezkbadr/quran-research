import { useEffect, useState } from "react";
import type { SurahData, SurahMeta } from "../../types";
import { DATA_URLS } from "../../lib/constants";
import type { SearchEntry } from "../search/types";

interface Options {
  onLoaded?: (data: SurahData) => void;
}

export function useSurahIndexes() {
  const [surahIndex, setSurahIndex] = useState<SurahMeta[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);

  useEffect(() => {
    fetch(DATA_URLS.surahIndex).then(r => r.json()).then(setSurahIndex).catch(() => {});
    fetch(DATA_URLS.searchIndex).then(r => r.json()).then(setSearchIndex).catch(() => {});
  }, []);

  return { surahIndex, searchIndex };
}

export function useSurahData(selectedSurahId: number, options?: Options) {
  const [surahData, setSurahData] = useState<SurahData | null>(null);

  // Derive loading instead of syncing it inside the effect.
  const loading = surahData?.id !== selectedSurahId;

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URLS.surah(selectedSurahId))
      .then(r => r.json())
      .then((d: SurahData) => {
        if (cancelled) return;
        setSurahData(d);
        options?.onLoaded?.(d);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // options is intentionally not a dep — only the surah id should trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSurahId]);

  return { surahData, loading };
}
