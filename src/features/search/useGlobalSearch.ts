import { useMemo } from "react";
import type { Verse } from "../../types";
import type { SearchEntry } from "./types";
import { filterBrowseVerses, filterSearchIndex } from "./filterSearchIndex";

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

export function useGlobalSearch({ query, activeRoot, searchIndex, surahVerses, activeTags, userTags }: Input): Output {
  const globalResults = useMemo(
    () => filterSearchIndex({ query, activeRoot, searchIndex }),
    [query, searchIndex, activeRoot],
  );

  const filtered = useMemo(
    () => filterBrowseVerses({ query, activeRoot, surahVerses, activeTags, userTags }),
    [surahVerses, query, activeRoot, activeTags, userTags],
  );

  return { globalResults, filtered };
}
