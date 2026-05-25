import { useCallback, useState } from "react";

export interface NavSnapshot {
  activeRoot: string | null;
  surahId: number;
  verseId: string | null;
  wordIdx: number | null;
}

/**
 * Browser-style navigation history with separate back and forward stacks.
 *
 * - `backStack` is ordered oldest → newest. The newest entry is the next
 *   step when going back.
 * - `fwdStack` is ordered next-forward → farthest-forward. Index 0 is the
 *   first step when going forward.
 *
 * Every nav action that captures state takes the current live snapshot from
 * the caller (the hook has no view of React state outside its own stacks).
 */
export function useNavigationHistory() {
  const [backStack, setBack] = useState<NavSnapshot[]>([]);
  const [fwdStack, setFwd] = useState<NavSnapshot[]>([]);

  /** Push the current live state onto the back stack and clear forward. */
  const push = useCallback((current: NavSnapshot) => {
    setBack(b => [...b, current]);
    setFwd([]);
  }, []);

  /** Pop the last back entry. Push `current` to forward. Returns the target. */
  const goBack = useCallback((current: NavSnapshot): NavSnapshot | null => {
    if (backStack.length === 0) return null;
    const target = backStack[backStack.length - 1];
    setBack(b => b.slice(0, -1));
    setFwd(f => [current, ...f]);
    return target;
  }, [backStack]);

  /** Pop the first forward entry. Push `current` to back. Returns the target. */
  const goForward = useCallback((current: NavSnapshot): NavSnapshot | null => {
    if (fwdStack.length === 0) return null;
    const target = fwdStack[0];
    setFwd(f => f.slice(1));
    setBack(b => [...b, current]);
    return target;
  }, [fwdStack]);

  /**
   * Jump back to `backStack[index]`. Intermediate back entries and the
   * current state move onto the forward stack in order, so a subsequent
   * forward sequence retraces the path.
   */
  const goBackTo = useCallback((index: number, current: NavSnapshot): NavSnapshot | null => {
    if (index < 0 || index >= backStack.length) return null;
    const target = backStack[index];
    const popped = backStack.slice(index + 1);
    setBack(backStack.slice(0, index));
    setFwd(f => [...popped, current, ...f]);
    return target;
  }, [backStack]);

  /**
   * Jump forward to `fwdStack[index]`. Intermediate forward entries and the
   * current state move onto the back stack so the path is still retraceable.
   */
  const goForwardTo = useCallback((index: number, current: NavSnapshot): NavSnapshot | null => {
    if (index < 0 || index >= fwdStack.length) return null;
    const target = fwdStack[index];
    const popped = fwdStack.slice(0, index);
    setFwd(fwdStack.slice(index + 1));
    setBack(b => [...b, current, ...popped]);
    return target;
  }, [fwdStack]);

  const clear = useCallback(() => {
    setBack([]);
    setFwd([]);
  }, []);

  return {
    backStack,
    fwdStack,
    push,
    goBack,
    goForward,
    goBackTo,
    goForwardTo,
    clear,
    canBack: backStack.length > 0,
    canForward: fwdStack.length > 0,
    depth: backStack.length + fwdStack.length,
  };
}
