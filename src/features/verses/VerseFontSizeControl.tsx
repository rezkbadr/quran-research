import { Minus, Plus } from "lucide-react";

interface Props {
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
}

const baseStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-3)",
};

export function VerseFontSizeControl({ onDecrease, onIncrease, canDecrease, canIncrease }: Props) {
  return (
    <div className="flex items-center" role="group" aria-label="حجم خط الآية">
      <button
        type="button"
        onClick={onDecrease}
        disabled={!canDecrease}
        className="w-9 h-9 rounded-r-sm flex items-center justify-center transition-colors"
        style={{ ...baseStyle, opacity: canDecrease ? 1 : 0.4, cursor: canDecrease ? "pointer" : "default", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        onMouseEnter={e => { if (canDecrease) e.currentTarget.style.background = "var(--bg-muted)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        aria-label="تصغير حجم الخط"
        title="تصغير حجم الخط"
      >
        <Minus size={14} strokeWidth={1.75} />
      </button>
      <span
        className="px-2 text-xs font-mono select-none"
        style={{ color: "var(--text-4)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", height: 36, lineHeight: "34px", letterSpacing: "0.05em" }}
        aria-hidden="true"
      >
        Aa
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={!canIncrease}
        className="w-9 h-9 rounded-l-sm flex items-center justify-center transition-colors"
        style={{ ...baseStyle, opacity: canIncrease ? 1 : 0.4, cursor: canIncrease ? "pointer" : "default", borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        onMouseEnter={e => { if (canIncrease) e.currentTarget.style.background = "var(--bg-muted)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        aria-label="تكبير حجم الخط"
        title="تكبير حجم الخط"
      >
        <Plus size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}
