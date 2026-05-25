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

  const clear = useCallback(() => setHistory([]), []);

  return { history, push, back, clear, depth: history.length };
}
