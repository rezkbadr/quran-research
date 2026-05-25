import { CopyVerseButtons } from "../verses/CopyVerseButtons";
import type { SearchEntry } from "./types";

interface Props {
  entry: SearchEntry;
  activeRoot: string | null;
  isSelected: boolean;
  onSelect: () => void;
  onWordSelect: (wordIdx: number) => void;
}

export function SearchResultCard({ entry, activeRoot, isSelected, onSelect, onWordSelect }: Props) {
  const tokens = entry.arabic.split(" ");

  return (
    <article
      className="rounded-sm transition-all"
      style={{
        background: isSelected ? "var(--bg-elev)" : "var(--bg-elev2)",
        border: "1px solid " + (isSelected ? "var(--accent)" : "var(--border)"),
        boxShadow: isSelected ? "0 1px 0 var(--accent), 0 4px 12px rgb(var(--accent-rgb) / 0.08)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-3 px-5 pt-4 pb-2 transition-colors"
        style={{ borderBottom: "1px solid var(--bg-muted)", cursor: "pointer" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        title={`الانتقال إلى ${entry.surah}:${entry.ayah} في سورة ${entry.name}`}
      >
        <div className="px-2 py-0.5 rounded-sm text-xs font-mono" style={{ background: "var(--accent)", color: "var(--bg)", letterSpacing: "0.05em" }}>
          {entry.surah}:{entry.ayah}
        </div>
        <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 16, color: "var(--text-2)" }}>{entry.name}</div>
        <div className="ml-auto" onClick={e => e.stopPropagation()}>
          <CopyVerseButtons verse={entry} />
        </div>
      </button>

      <div
        className="px-5 py-5"
        dir="rtl"
        style={{ fontFamily: "'Amiri', serif", fontSize: 28, lineHeight: 2, color: "var(--text)", textAlign: "right" }}
      >
        {tokens.map((tok, i) => {
          const isMatch = activeRoot != null && entry.wordRoots[i] === activeRoot;
          return (
            <span
              key={i}
              className={"arabic-word" + (isMatch ? " is-root-match" : "")}
              onClick={() => onWordSelect(i)}
              style={{ display: "inline-block", padding: "2px 6px", marginInline: 2, borderRadius: 2, cursor: "pointer" }}
            >
              {tok}
            </span>
          );
        })}
      </div>

      {entry.roots.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5" dir="rtl">
          {entry.roots.map(r => (
            <span
              key={r}
              className="px-2 py-0.5 rounded-sm text-xs"
              style={{
                background: activeRoot === r ? "rgb(var(--accent-rgb) / 0.18)" : "transparent",
                border: "1px solid " + (activeRoot === r ? "var(--accent)" : "var(--border)"),
                color: "var(--text-2)",
              }}
            >
              <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 13, fontWeight: 600 }}>{r}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
