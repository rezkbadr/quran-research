import { norm } from "../../data/helpers";
import { QUERY_ROOTS_LIMIT } from "../../lib/constants";
import type { SearchEntry } from "./types";

export const MIN_TERM_LEN = 2;

/**
 * Aggregate root frequencies across the search index for words whose
 * normalized form matches any normalized search term. Returns an array of
 * `[root, count]` tuples sorted by descending count, capped at
 * `QUERY_ROOTS_LIMIT`.
 *
 * Returns an empty array when the trimmed query is shorter than
 * `MIN_TERM_LEN` or contains no terms of usable length.
 */
export function aggregateQueryRoots(query: string, searchIndex: SearchEntry[]): Array<[string, number]> {
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
}
