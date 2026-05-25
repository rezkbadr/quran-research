import { useCallback, useState } from "react";

export interface NavSnapshot {
  activeRoot: string | null;
  surahId: number;
  verseId: string | null;
  wordIdx: number | null;
}

/**
 * Browser-history-style navigation stack. Each entry captures the state of
 * the app at the moment just before a navigation action (root click,
 * search-result click). `back()` pops the most recent entry and returns it
 * so the caller can restore that state.
 */
export function useNavigationHistory() {
  const [history, setHistory] = useState<NavSnapshot[]>([]);

  const push = useCallback((snap: NavSnapshot) => {
    setHistory(h => [...h, snap]);
  }, []);

  const back = useCallback((): NavSnapshot | null => {
    if (history.length === 0) return null;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    return last;
  }, [history]);

  /**
   * Jump back to a specific entry. Returns the snapshot to restore, after
   * dropping that entry and everything newer than it from the stack.
   */
  const backTo = useCallback((index: number): NavSnapshot | null => {
    if (index < 0 || index >= history.length) return null;
    const target = history[index];
    setHistory(h => h.slice(0, index));
    return target;
  }, [history]);

  const clear = useCallback(() => setHistory([]), []);

  return { history, push, back, backTo, clear, depth: history.length };
}
