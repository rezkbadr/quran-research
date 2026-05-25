import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates `delay` ms after the
 * source stops changing. Intended for high-frequency inputs (search boxes,
 * sliders) so downstream consumers don't recompute on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
