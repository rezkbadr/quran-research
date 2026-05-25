import { ArrowUp } from "lucide-react";

interface Props {
  visible: boolean;
}

export function ScrollToTopButton({ visible }: Props) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="العودة إلى الأعلى"
      title="العودة إلى الأعلى"
      className="fixed bottom-6 left-6 w-11 h-11 rounded-full flex items-center justify-center z-30 transition-all"
      style={{
        background: "var(--accent)",
        color: "var(--bg)",
        boxShadow: "0 4px 14px rgb(var(--accent-rgb) / 0.35)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.85)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <ArrowUp size={18} strokeWidth={2} />
    </button>
  );
}
