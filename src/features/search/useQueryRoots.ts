import { useMemo } from "react";
import type { SearchEntry } from "./types";
import { aggregateQueryRoots } from "./aggregateQueryRoots";

export function useQueryRoots(query: string, searchIndex: SearchEntry[]): Array<[string, number]> {
  return useMemo(() => aggregateQueryRoots(query, searchIndex), [query, searchIndex]);
}
