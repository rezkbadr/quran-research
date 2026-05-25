import { Sun, Moon } from "lucide-react";

export type Theme = "light" | "dark";

interface Props {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="w-9 h-9 rounded-sm flex items-center justify-center transition-colors"
      style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-3)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      aria-label={theme === "dark" ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
      title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {theme === "dark" ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
    </button>
  );
}
