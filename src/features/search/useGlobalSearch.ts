import { useMemo } from "react";
import { norm } from "../../data/helpers";
import type { Verse } from "../../types";
import type { SearchEntry } from "./types";

interface Input {
  query: string;
  activeRoot: string | null;
  searchIndex: SearchEntry[];
  surahVerses: Verse[];
  activeTags: string[];
  userTags: Record<string, string[]>;
}

interface Output {
  globalResults: SearchEntry[] | null;
  filtered: Verse[];
}

const MIN_QUERY_LEN = 2;

export function useGlobalSearch({ query, activeRoot, searchIndex, surahVerses, activeTags, userTags }: Input): Output {
  const globalResults = useMemo(() => {
    const q = query.trim();
    if (!searchIndex.length) return null;
    if (q.length < MIN_QUERY_LEN && !activeRoot) return null;
    if (!q && activeRoot) return searchIndex.filter(e => e.roots.includes(activeRoot));

    const refMatch = q.match(/^(\d+):(\d+)$/);
    const terms = q.split(/\s+/).filter(Boolean);
    const isMultiWord = terms.length > 1 && terms.every(t => t.length >= MIN_QUERY_LEN);

    return searchIndex.filter(e => {
      if (refMatch) return e.surah === +refMatch[1] && e.ayah === +refMatch[2];
      if (activeRoot && !e.roots.includes(activeRoot)) return false;
      if (isMultiWord) {
        return terms.every(t => {
          const tn = norm(t);
          return norm(e.arabic).includes(tn) || e.roots.some(r => r.includes(t));
        });
      }
      return norm(e.arabic).includes(norm(q)) || e.roots.some(r => r.includes(q));
    });
  }, [query, searchIndex, activeRoot]);

  const filtered = useMemo(() => {
    if (query.trim()) return [];
    return surahVerses.filter(v => {
      if (activeRoot && !v.words.some(w => w.root === activeRoot)) return false;
      if (activeTags.length) {
        const tags = userTags[v.id] || [];
        if (!activeTags.every(t => tags.includes(t))) return false;
      }
      return true;
    });
  }, [surahVerses, query, activeRoot, activeTags, userTags]);

  return { globalResults, filtered };
}
