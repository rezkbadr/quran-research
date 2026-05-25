import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_VERSE_FONT_SIZE_INDEX,
  STORAGE_KEYS,
  VERSE_FONT_SIZES,
} from "../../lib/constants";
import { loadString, saveString } from "../../lib/storage";

function readInitialIndex(): number {
  if (typeof window === "undefined") return DEFAULT_VERSE_FONT_SIZE_INDEX;
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEYS.verseFontSize);
    if (stored !== null) {
      const n = Number(stored);
      if (Number.isInteger(n) && n >= 0 && n < VERSE_FONT_SIZES.length) return n;
    }
  } catch { /* ignore */ }
  return DEFAULT_VERSE_FONT_SIZE_INDEX;
}

/**
 * Stepped font-size control for the verse text. Persists the chosen step
 * across reloads via both window.storage (web env) and localStorage.
 */
export function useVerseFontSize() {
  const [index, setIndex] = useState<number>(readInitialIndex);

  useEffect(() => {
    saveString(STORAGE_KEYS.verseFontSize, String(index));
  }, [index]);

  // Hydrate from async storage (web environment) once.
  useEffect(() => {
    (async () => {
      const stored = await loadString(STORAGE_KEYS.verseFontSize);
      if (stored == null) return;
      const n = Number(stored);
      if (Number.isInteger(n) && n >= 0 && n < VERSE_FONT_SIZES.length) setIndex(n);
    })();
  }, []);

  const increase = useCallback(() => {
    setIndex(i => Math.min(i + 1, VERSE_FONT_SIZES.length - 1));
  }, []);
  const decrease = useCallback(() => {
    setIndex(i => Math.max(i - 1, 0));
  }, []);
  const reset = useCallback(() => {
    setIndex(DEFAULT_VERSE_FONT_SIZE_INDEX);
  }, []);

  return {
    size: VERSE_FONT_SIZES[index],
    index,
    increase,
    decrease,
    reset,
    canIncrease: index < VERSE_FONT_SIZES.length - 1,
    canDecrease: index > 0,
  };
}
