import { useMemo } from "react";
import { norm } from "../../data/helpers";
import { QUERY_ROOTS_LIMIT } from "../../lib/constants";
import type { SearchEntry } from "./types";

const MIN_TERM_LEN = 2;

export function useQueryRoots(query: string, searchIndex: SearchEntry[]): Array<[string, number]> {
  return useMemo(() => {
    const q = query.trim();
    if (q.length < MIN_TERM_LEN || !searchIndex.length) return [];
    const terms = q.split(/\s+/).map(t => norm(t)).filter(t => t.length >= MIN_TERM_LEN);
    if (!terms.length) return [];

    const counts: Record<string, number> = {};
    for (const e of searchIndex) {
      const tokens = e.arabic.split(" ");
      for (let i = 0; i < tokens.length; i++) {
        const root = e.wordRoots[i];
        if (!root) continue;
        const w = norm(tokens[i]);
        if (terms.some(t => w.includes(t))) counts[root] = (counts[root] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, QUERY_ROOTS_LIMIT);
  }, [query, searchIndex]);
}
