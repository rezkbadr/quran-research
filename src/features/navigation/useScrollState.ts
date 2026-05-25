import { useEffect, useState } from "react";
import { SCROLL_TRIGGER_PX } from "../../lib/constants";

export function useScrollPastThreshold(threshold = SCROLL_TRIGGER_PX): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return past;
}
