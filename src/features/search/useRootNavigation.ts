import { useCallback, useState } from "react";
import type { RootReturnTarget } from "./types";

interface Options {
  onClearWordSelection: () => void;
  onNavigateToTarget: (target: RootReturnTarget) => void;
}

export function useRootNavigation({ onClearWordSelection, onNavigateToTarget }: Options) {
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<RootReturnTarget | null>(null);

  const selectRoot = useCallback((root: string, from?: RootReturnTarget) => {
    setActiveRoot(root);
    setReturnTo(from ?? null);
    onClearWordSelection();
  }, [onClearWordSelection]);

  const clearRoot = useCallback(() => {
    setActiveRoot(null);
    setReturnTo(null);
  }, []);

  const returnFromRoot = useCallback(() => {
    setActiveRoot(null);
    const target = returnTo;
    setReturnTo(null);
    if (target) onNavigateToTarget(target);
  }, [returnTo, onNavigateToTarget]);

  return { activeRoot, setActiveRoot, returnTo, selectRoot, clearRoot, returnFromRoot };
}
