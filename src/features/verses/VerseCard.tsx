import { FileText } from "lucide-react";
import type { Verse } from "../../types";
import { Chip } from "../../components/Chip";
import { CopyVerseButtons } from "./CopyVerseButtons";
import type { RootReturnTarget } from "../search/types";

interface Props {
  verse: Verse;
  tags: string[];
  hasNote: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onWordClick: (idx: number) => void;
  selectedWordIdx: number | null;
  activeRoot: string | null;
  onRootClick: (root: string, from?: RootReturnTarget) => void;
}

export function VerseCard({
  verse, tags, hasNote, isSelected, onSelect, onWordClick, selectedWordIdx, activeRoot, onRootClick,
}: Props) {
  const uniqueRoots = Array.from(
    new Set(verse.words.map((w) => w.root).filter((r): r is string => r !== null))
  );

  return (
    <article
      onClick={onSelect}
      className="rounded-sm cursor-pointer transition-all"
      style={{
        background: isSelected ? "var(--bg-elev)" : "var(--bg-elev2)",
        border: "1px solid " + (isSelected ? "var(--accent)" : "var(--border)"),
        boxShadow: isSelected ? "0 1px 0 var(--accent), 0 4px 12px rgb(var(--accent-rgb) / 0.08)" : "none",
      }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center gap-3" style={{ borderBottom: "1px solid var(--bg-muted)" }}>
        <div className="px-2 py-0.5 rounded-sm text-xs font-mono" style={{ background: "var(--accent)", color: "var(--bg)", letterSpacing: "0.05em" }}>
          {verse.surah}:{verse.ayah}
        </div>
        <CopyVerseButtons verse={verse} />
        <div className="ml-auto flex items-center gap-2">
          {tags.map((t) => <Chip key={t}>{t}</Chip>)}
          {hasNote && (
            <span title="توجد ملاحظة" style={{ color: "var(--accent)" }}>
              <FileText size={14} />
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-6" dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 32, lineHeight: 2, color: "var(--text)", textAlign: "right" }}>
        {verse.words.map((w, i) => {
          const isRootMatch = activeRoot && w.root === activeRoot;
          const isSel = isSelected && selectedWordIdx === i;
          const cls = "arabic-word" + (isRootMatch ? " is-root-match" : "") + (isSel ? " is-selected" : "");
          return (
            <span
              key={i}
              className={cls}
              onClick={(e) => { e.stopPropagation(); onWordClick(i); }}
              style={{ display: "inline-block", padding: "2px 6px", marginInline: 2, borderRadius: 2, cursor: "pointer" }}
            >
              {w.ar}
            </span>
          );
        })}
      </div>

      <div className="px-5 pb-4 flex flex-wrap gap-1.5" dir="rtl">
        {uniqueRoots.map((r) => (
          <button
            key={r}
            onClick={(e) => { e.stopPropagation(); onRootClick(r, { surahId: verse.surah, verseId: verse.id, wordIdx: null }); }}
            className="px-2 py-0.5 rounded-sm text-xs transition-colors"
            style={{
              background: activeRoot === r ? "rgb(var(--accent-rgb) / 0.18)" : "transparent",
              border: "1px solid " + (activeRoot === r ? "var(--accent)" : "var(--border)"),
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 14, fontWeight: 600 }}>{r}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
