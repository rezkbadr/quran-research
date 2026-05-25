import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  children: ReactNode;
  onRemove?: () => void;
  variant?: "root";
}

export function Chip({ children, onRemove, variant }: Props) {
  const styles: CSSProperties = variant === "root"
    ? { background: "rgb(var(--accent-rgb) / 0.12)", color: "var(--accent)", border: "1px solid rgb(var(--accent-rgb) / 0.3)" }
    : { background: "var(--bg-muted)", color: "var(--text-2)", border: "1px solid var(--border)" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs" style={styles}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70" aria-label="حذف">
          <X size={11} />
        </button>
      )}
    </span>
  );
}
