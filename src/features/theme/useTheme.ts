import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../lib/constants";
import { loadString, saveString } from "../../lib/storage";
import type { Theme } from "./ThemeToggle";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage?.getItem(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveString(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // Hydrate from async storage (window.storage on the web environment) once.
  useEffect(() => {
    (async () => {
      const stored = await loadString(STORAGE_KEYS.theme);
      if (stored === "light" || stored === "dark") setTheme(stored);
    })();
  }, []);

  const toggle = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);

  return { theme, toggle };
}
