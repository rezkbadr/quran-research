import { Search, BookOpen } from "lucide-react";

interface Props {
  visible: boolean;
  mode: "browse" | "search" | "root" | null;
  query: string;
  activeRoot: string | null;
  surahName: string | null;
  resultCount: number;
  totalCount: number;
  totalUnit: string;
}

export function Breadcrumb({ visible, mode, query, activeRoot, surahName, resultCount, totalCount, totalUnit }: Props) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-30"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-center gap-3 text-sm" dir="rtl">
        {mode === "search" && (
          <>
            <Search size={14} style={{ color: "var(--text-4)" }} />
            <span style={{ color: "var(--text-4)" }}>البحث:</span>
            <span style={{ color: "var(--text)", fontFamily: "'Amiri', serif" }}>«{query}»</span>
          </>
        )}
        {mode === "root" && activeRoot && (
          <>
            <span style={{ color: "var(--text-4)" }}>الجذر:</span>
            <span style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "var(--accent)", fontWeight: 600 }}>{activeRoot}</span>
          </>
        )}
        {mode === "browse" && surahName && (
          <>
            <BookOpen size={14} style={{ color: "var(--text-4)" }} />
            <span style={{ color: "var(--text-4)" }}>سورة</span>
            <span style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "var(--text)" }}>{surahName}</span>
          </>
        )}
        <span className="mr-auto text-xs" style={{ color: "var(--text-4)" }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>{resultCount}</span>
          <span className="mx-1">/</span>
          <span>{totalCount} {totalUnit}</span>
        </span>
      </div>
    </div>
  );
}
