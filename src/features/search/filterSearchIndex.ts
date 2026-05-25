import { norm } from "../../data/helpers";
import type { Verse } from "../../types";
import type { SearchEntry } from "./types";

export const MIN_QUERY_LEN = 2;

export interface FilterInput {
  query: string;
  activeRoot: string | null;
  searchIndex: SearchEntry[];
}

/**
 * Filter the search index by a free-text query and/or an active root.
 *
 * Returns `null` when no global search mode is active (empty query + no root,
 * or a query shorter than `MIN_QUERY_LEN` with no root). Returns an array
 * of matching entries otherwise.
 *
 * Semantics:
 * - Reference query like "2:255" matches exactly that surah/ayah.
 * - Multi-word query (≥2 terms, each ≥2 chars) requires every term to appear
 *   either in the normalized arabic text or as a substring of a root.
 * - Single-term query is treated as a phrase match against normalized text
 *   or a substring match against any root (so root patterns like "ر ح م"
 *   continue to work).
 * - Active root acts as an AND constraint when combined with a query.
 */
export function filterSearchIndex({ query, activeRoot, searchIndex }: FilterInput): SearchEntry[] | null {
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
}

export interface BrowseFilterInput {
  query: string;
  activeRoot: string | null;
  surahVerses: Verse[];
  activeTags: string[];
  userTags: Record<string, string[]>;
}

/** Filter the currently loaded surah by active root and active tags. */
export function filterBrowseVerses({ query, activeRoot, surahVerses, activeTags, userTags }: BrowseFilterInput): Verse[] {
  if (query.trim()) return [];
  return surahVerses.filter(v => {
    if (activeRoot && !v.words.some(w => w.root === activeRoot)) return false;
    if (activeTags.length) {
      const tags = userTags[v.id] || [];
      if (!activeTags.every(t => tags.includes(t))) return false;
    }
    return true;
  });
}
