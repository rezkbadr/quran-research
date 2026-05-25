import { useState, type CSSProperties, type MouseEvent } from "react";
import { Copy, Eraser, Check } from "lucide-react";
import { stripDiacritics } from "../../data/helpers";

interface CopyTarget {
  arabic: string;
  surah: number;
  ayah: number;
}

const COPIED_RESET_MS = 1200;

const btnStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-3)",
};

export function CopyVerseButtons({ verse }: { verse: CopyTarget }) {
  const [copied, setCopied] = useState<"with" | "without" | null>(null);

  const doCopy = async (variant: "with" | "without", e: MouseEvent) => {
    e.stopPropagation();
    const text = variant === "with" ? verse.arabic : stripDiacritics(verse.arabic);
    try {
      await navigator.clipboard.writeText(`${text} (${verse.surah}:${verse.ayah})`);
      setCopied(variant);
      setTimeout(() => setCopied(null), COPIED_RESET_MS);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={e => doCopy("with", e)}
        className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors"
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        aria-label="نسخ مع التشكيل"
        title="نسخ مع التشكيل"
      >
        {copied === "with" ? <Check size={13} strokeWidth={2} style={{ color: "var(--accent)" }} /> : <Copy size={13} strokeWidth={1.75} />}
      </button>
      <button
        onClick={e => doCopy("without", e)}
        className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors"
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        aria-label="نسخ بدون تشكيل"
        title="نسخ بدون تشكيل"
      >
        {copied === "without" ? <Check size={13} strokeWidth={2} style={{ color: "var(--accent)" }} /> : <Eraser size={13} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
