import { useRef, useState } from "react";
import { Tag, FileText, Plus, Bookmark, Type } from "lucide-react";
import type { Verse, Word } from "../../types";
import { ROOT_GLOSS } from "../../data/verses";
import { Chip } from "../../components/Chip";
import type { RootReturnTarget } from "../search/types";

const TAG_SUGGESTION_LIMIT = 5;

interface Props {
  verse: Verse | null;
  wordSel: { verseId: string; idx: number } | null;
  tags: string[];
  note: string;
  allTagSuggestions: string[];
  onAddTag: (verseId: string, tag: string) => void;
  onRemoveTag: (verseId: string, tag: string) => void;
  onSetNote: (verseId: string, note: string) => void;
  onRootClick: (root: string, from?: RootReturnTarget) => void;
  surahName: string;
}

export function DetailPanel({
  verse, wordSel, tags, note, allTagSuggestions, onAddTag, onRemoveTag, onSetNote, onRootClick, surahName,
}: Props) {
  const [tagInput, setTagInput] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastVerseIdRef = useRef<string | null>(null);

  if (verse?.id !== lastVerseIdRef.current) {
    lastVerseIdRef.current = verse?.id ?? null;
    if (tagInput) setTagInput("");
  }

  if (!verse) {
    return (
      <div className="rounded-sm p-6" style={{ background: "var(--bg-elev)", border: "1px dashed var(--border)" }}>
        <Bookmark size={20} style={{ color: "var(--text-5)" }} />
        <p className="mt-3" style={{ fontFamily: "'Amiri', serif", fontSize: 20, color: "var(--text-2)" }} dir="rtl">
          اختر آية للتفصيل.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-5)" }} dir="rtl">
          انقر على أي آية لعرض تفاصيل كلماتها، وإضافة وسوم، أو تدوين ملاحظة.
        </p>
      </div>
    );
  }

  const word: Word | null = wordSel?.verseId === verse.id ? verse.words[wordSel.idx] : null;
  const matchingSuggestions = tagInput.trim()
    ? allTagSuggestions.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).slice(0, TAG_SUGGESTION_LIMIT)
    : allTagSuggestions.filter((t) => !tags.includes(t)).slice(0, TAG_SUGGESTION_LIMIT);

  const submitTag = (val?: string) => {
    onAddTag(verse.id, val ?? tagInput);
    setTagInput("");
    setShowSuggest(false);
  };

  return (
    <div className="rounded-sm overflow-hidden" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--bg-muted)", background: "var(--bg-elev2)" }}>
        <div className="text-xs font-mono" style={{ color: "var(--accent)", letterSpacing: "0.05em" }}>
          {verse.surah}:{verse.ayah}
        </div>
        <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "var(--text)", marginTop: 2 }}>
          سورة {surahName}
        </div>
      </div>

      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--bg-muted)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Type size={13} style={{ color: "var(--text-4)" }} />
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "var(--text-2)", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
            {word ? "الكلمة" : "مُفتِّش الكلمات"}
          </h3>
        </div>
        {word ? (
          <div>
            <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 42, lineHeight: 1.4, color: "var(--text)" }}>
              {word.ar}
            </div>
            {word.tr && <div className="text-sm italic mt-1" style={{ color: "var(--text-3)" }}>{word.tr}</div>}
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="uppercase tracking-wider mb-1" style={{ color: "var(--text-5)", letterSpacing: "0.1em" }} dir="rtl">اللمّة</div>
                <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "var(--text)" }}>{word.lemma || "—"}</div>
              </div>
              <div>
                <div className="uppercase tracking-wider mb-1" style={{ color: "var(--text-5)", letterSpacing: "0.1em" }} dir="rtl">الجذر</div>
                {word.root ? (
                  <button
                    onClick={() => onRootClick(word.root!, { surahId: verse.surah, verseId: verse.id, wordIdx: wordSel?.idx ?? null })}
                    className="px-2 py-1 rounded-sm transition-colors"
                    style={{ background: "rgb(var(--accent-rgb) / 0.1)", border: "1px solid rgb(var(--accent-rgb) / 0.3)" }}
                  >
                    <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "var(--accent)", fontWeight: 600 }}>{word.root}</span>
                  </button>
                ) : <span style={{ color: "var(--text-5)" }}>—</span>}
              </div>
            </div>
            {word.root && ROOT_GLOSS[word.root] && (
              <div className="mt-3 text-xs italic px-3 py-2 rounded-sm" style={{ color: "var(--text-3)", background: "var(--bg-elev2)" }} dir="rtl">
                {ROOT_GLOSS[word.root]}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs italic" style={{ color: "var(--text-5)" }} dir="rtl">
            انقر على أي كلمة عربية لعرض جذرها ولمّها.
          </p>
        )}
      </div>

      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--bg-muted)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={13} style={{ color: "var(--text-4)" }} />
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "var(--text-2)", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
            الوسوم
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.length === 0 && <span className="text-xs italic" style={{ color: "var(--text-5)" }} dir="rtl">لا وسوم بعد.</span>}
          {tags.map((t) => (
            <Chip key={t} onRemove={() => onRemoveTag(verse.id, t)}>{t}</Chip>
          ))}
        </div>
        <div className="relative">
          <div className="flex items-stretch gap-2">
            <input
              ref={inputRef}
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setShowSuggest(true); }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitTag(); } }}
              placeholder="مثال: رحمة، أسماء الله، دعاء…"
              dir="rtl"
              className="flex-1 px-3 py-2 rounded-sm text-sm outline-none"
              style={{ background: "var(--bg-elev2)", border: "1px solid var(--border)", fontFamily: "'Amiri', serif" }}
            />
            <button
              onClick={() => submitTag()}
              className="px-3 rounded-sm flex items-center"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              <Plus size={14} />
            </button>
          </div>
          {showSuggest && matchingSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-sm z-10" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
              {matchingSuggestions.map((t) => (
                <button
                  key={t}
                  onMouseDown={(e) => { e.preventDefault(); submitTag(t); }}
                  className="w-full text-right px-3 py-1.5 text-xs hover:bg-[var(--bg-muted)]"
                  style={{ color: "var(--text-2)" }}
                  dir="rtl"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={13} style={{ color: "var(--text-4)" }} />
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "var(--text-2)", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
            ملاحظة
          </h3>
        </div>
        <textarea
          value={note}
          onChange={(e) => onSetNote(verse.id, e.target.value)}
          placeholder="مرجع تفسيري، إحالة مقارنة، تعليقك الخاص…"
          rows={5}
          dir="rtl"
          className="w-full px-3 py-2 rounded-sm text-sm outline-none resize-none"
          style={{
            background: "var(--bg-elev2)",
            border: "1px solid var(--border)",
            fontFamily: "'Amiri', serif",
            fontSize: 16,
            lineHeight: 1.7,
            color: "var(--text)",
          }}
        />
      </div>
    </div>
  );
}
