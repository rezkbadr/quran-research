import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Tag, X, BookOpen, Hash, FileText, Plus, Filter, Bookmark, Type } from "lucide-react";
import type { Verse, Word } from "./types";
import { VERSES, ROOT_GLOSS } from "./data/verses";
import { norm } from "./data/helpers";

declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

function App() {
  const [userTags, setUserTags] = useState<Record<string, string[]>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ verseId: string; idx: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let tags: Record<string, string[]> = {};
        let notes: Record<string, string> = {};
        try {
          const t = await window.storage?.get("quran:tags");
          if (t?.value) tags = JSON.parse(t.value);
        } catch (_) {}
        try {
          const n = await window.storage?.get("quran:notes");
          if (n?.value) notes = JSON.parse(n.value);
        } catch (_) {}
        setUserTags(tags);
        setUserNotes(notes);
      } catch {
        setStorageError("التخزين غير متاح؛ ستبقى الوسوم والملاحظات فقط طوال هذه الجلسة.");
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.storage?.set("quran:tags", JSON.stringify(userTags)).catch(() => {});
  }, [userTags, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.storage?.set("quran:notes", JSON.stringify(userNotes)).catch(() => {});
  }, [userNotes, storageReady]);

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(userTags).forEach((arr) =>
      arr.forEach((t) => { counts[t] = (counts[t] || 0) + 1; })
    );
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [userTags]);

  const allRoots = useMemo(() => {
    const counts: Record<string, number> = {};
    VERSES.forEach((v) =>
      v.words.forEach((w) => { if (w.root) counts[w.root] = (counts[w.root] || 0) + 1; })
    );
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    const qNorm = norm(q);
    const qLower = q.toLowerCase();
    const refMatch = q.match(/^(\d+):(\d+)$/);

    return VERSES.filter((v) => {
      if (refMatch) return v.surah === +refMatch[1] && v.ayah === +refMatch[2];
      if (activeRoot && !v.words.some((w) => w.root === activeRoot)) return false;
      if (activeTags.length) {
        const tags = userTags[v.id] || [];
        if (!activeTags.every((t) => tags.includes(t))) return false;
      }
      if (q) {
        const hitArabic = norm(v.arabic).includes(qNorm) || v.words.some((w) => norm(w.ar).includes(qNorm));
        const hitRoot = v.words.some((w) => w.root && (w.root.includes(q) || norm(w.root).includes(qNorm)));
        const hitTransliteration = v.words.some((w) => w.tr.toLowerCase().includes(qLower));
        const hitName = v.surahName.includes(q);
        if (!(hitArabic || hitRoot || hitTransliteration || hitName)) return false;
      }
      return true;
    });
  }, [query, activeRoot, activeTags, userTags]);

  const selectedVerse = useMemo(
    () => VERSES.find((v) => v.id === selectedId) ?? null,
    [selectedId]
  );

  const addTag = (verseId: string, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setUserTags((prev) => {
      const cur = prev[verseId] || [];
      if (cur.includes(t)) return prev;
      return { ...prev, [verseId]: [...cur, t] };
    });
  };

  const removeTag = (verseId: string, tag: string) => {
    setUserTags((prev) => {
      const cur = (prev[verseId] || []).filter((x) => x !== tag);
      const next = { ...prev };
      if (cur.length) next[verseId] = cur; else delete next[verseId];
      return next;
    });
  };

  const setNote = (verseId: string, note: string) => {
    setUserNotes((prev) => {
      const next = { ...prev };
      if (note.trim()) next[verseId] = note; else delete next[verseId];
      return next;
    });
  };

  const toggleActiveTag = (t: string) =>
    setActiveTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);

  const handleRootClick = (root: string) => {
    setActiveRoot(root);
    setSelectedWord(null);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveTags([]);
    setActiveRoot(null);
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#f5efe2",
        backgroundImage:
          "radial-gradient(1200px 600px at 0% 0%, rgba(45,93,79,0.06), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(140,80,30,0.05), transparent 60%)",
        color: "#1a1612",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <FontStyles />

      <header className="border-b" style={{ borderColor: "#d9cfb6", background: "rgba(253,250,240,0.7)", backdropFilter: "blur(10px)" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "#2d5d4f", color: "#f5efe2" }}>
              <BookOpen size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 24, lineHeight: 1, letterSpacing: "-0.01em" }}>
                مِشكَاة
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "#6b6052", letterSpacing: "0.05em" }}>
                مِنصَّةُ البَحثِ القُرآنِي
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-auto relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7d68" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالعربية، أو بالجذر (مثال: ك ت ب)، أو بالمرجع (2:255)…"
              dir="rtl"
              className="w-full pr-10 pl-4 py-2.5 rounded-sm outline-none text-sm"
              style={{ background: "#fdfaf0", border: "1px solid #d9cfb6", fontFamily: "'Amiri', serif", fontSize: 16 }}
            />
          </div>

          <div className="text-xs" style={{ color: "#6b6052" }}>
            <span style={{ fontWeight: 600, color: "#1a1612" }}>{filtered.length}</span>
            <span className="mx-1">/</span>
            <span>{VERSES.length} آية</span>
          </div>
        </div>
        {storageError && (
          <div className="max-w-[1400px] mx-auto px-6 pb-3 text-xs" style={{ color: "#8a4a1a" }} dir="rtl">
            {storageError}
          </div>
        )}
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 grid gap-6" style={{ gridTemplateColumns: "260px 1fr 360px" }}>
        {/* Sidebar: filters */}
        <aside className="space-y-6">
          <Section title="التصفية" icon={<Filter size={14} />}>
            {(activeTags.length > 0 || activeRoot || query) ? (
              <button onClick={clearFilters} className="text-xs underline-offset-2 hover:underline" style={{ color: "#2d5d4f" }} dir="rtl">
                مسح جميع التصفيات
              </button>
            ) : (
              <p className="text-xs italic" style={{ color: "#8a7d68" }} dir="rtl">لا توجد تصفية نشطة.</p>
            )}
            {activeRoot && (
              <div className="mt-2 flex items-center gap-2 text-xs" dir="rtl">
                <span style={{ color: "#6b6052" }}>الجذر:</span>
                <Chip onRemove={() => setActiveRoot(null)} variant="root">
                  <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 14 }}>{activeRoot}</span>
                </Chip>
              </div>
            )}
          </Section>

          <Section title="وسوماتك" icon={<Tag size={14} />} count={allTags.length}>
            {allTags.length === 0 ? (
              <p className="text-xs italic" style={{ color: "#8a7d68" }} dir="rtl">سمِّ آية لبناء تصنيفك.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(([t, c]) => (
                  <button
                    key={t}
                    onClick={() => toggleActiveTag(t)}
                    className="px-2 py-1 rounded-sm text-xs transition-colors"
                    style={{
                      background: activeTags.includes(t) ? "#2d5d4f" : "#ece2c8",
                      color: activeTags.includes(t) ? "#f5efe2" : "#3d362c",
                      border: "1px solid " + (activeTags.includes(t) ? "#2d5d4f" : "#d9cfb6"),
                    }}
                  >
                    {t} <span style={{ opacity: 0.7 }}>· {c}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="الجذور في المتن" icon={<Hash size={14} />} count={allRoots.length}>
            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scroll">
              {allRoots.map(([r, c]) => (
                <button
                  key={r}
                  onClick={() => handleRootClick(r)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm transition-colors"
                  style={{
                    background: activeRoot === r ? "#2d5d4f" : "transparent",
                    color: activeRoot === r ? "#f5efe2" : "#3d362c",
                  }}
                  onMouseEnter={(e) => { if (activeRoot !== r) e.currentTarget.style.background = "#ece2c8"; }}
                  onMouseLeave={(e) => { if (activeRoot !== r) e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="flex items-center gap-2 text-xs" style={{ opacity: 0.8 }}>
                    <span>{c}</span>
                    <span className="italic" style={{ fontSize: 11 }}>{ROOT_GLOSS[r]?.split("،")[0]}</span>
                  </span>
                  <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, fontWeight: 600 }}>{r}</span>
                </button>
              ))}
            </div>
          </Section>
        </aside>

        {/* Center: verse list */}
        <main className="space-y-4 min-w-0">
          {filtered.length === 0 ? (
            <div className="rounded-sm p-10 text-center" style={{ background: "#fdfaf0", border: "1px dashed #d9cfb6" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#5c5247" }}>
                لا توجد نتائج مطابقة.
              </p>
              <p className="text-xs mt-2" style={{ color: "#8a7d68" }} dir="rtl">
                جرِّب مسح التصفيات أو ابحث بجذر معروف مثل{" "}
                <span style={{ fontFamily: "'Amiri', serif" }}>ر ح م</span>
              </p>
            </div>
          ) : (
            filtered.map((v) => (
              <VerseCard
                key={v.id}
                verse={v}
                tags={userTags[v.id] || []}
                hasNote={!!userNotes[v.id]}
                isSelected={selectedId === v.id}
                onSelect={() => setSelectedId(v.id)}
                onWordClick={(idx) => { setSelectedId(v.id); setSelectedWord({ verseId: v.id, idx }); }}
                selectedWordIdx={selectedWord?.verseId === v.id ? selectedWord.idx : null}
                activeRoot={activeRoot}
                onRootClick={handleRootClick}
              />
            ))
          )}
        </main>

        {/* Right: detail panel */}
        <aside className="space-y-4">
          <DetailPanel
            verse={selectedVerse}
            wordSel={selectedWord}
            tags={selectedVerse ? (userTags[selectedVerse.id] || []) : []}
            note={selectedVerse ? (userNotes[selectedVerse.id] || "") : ""}
            allTagSuggestions={allTags.map(([t]) => t)}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onSetNote={setNote}
            onRootClick={handleRootClick}
          />
        </aside>
      </div>

      <footer className="max-w-[1400px] mx-auto px-6 py-8 text-xs" style={{ color: "#8a7d68" }} dir="rtl">
        يعرض متناً تجريبياً — الفاتحة، ومختارات من البقرة، وسورة الإخلاص. للتوسع، اربط واجهة برمجة Quran.com أو مدوّنة القرآن العربي.
      </footer>
    </div>
  );
}

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #d9cfb6; border-radius: 3px; }
      .arabic-word { transition: background-color 0.15s ease, color 0.15s ease; }
      .arabic-word:hover { background-color: #ece2c8; }
      .arabic-word.is-root-match { background-color: rgba(45,93,79,0.12); }
      .arabic-word.is-selected { background-color: #2d5d4f; color: #f5efe2; }
    `}</style>
  );
}

function Section({ title, icon, count, children }: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5 pb-2" style={{ borderBottom: "1px solid #d9cfb6" }}>
        <span style={{ color: "#6b6052" }}>{icon}</span>
        <h2 className="text-xs uppercase tracking-wider" style={{ color: "#3d362c", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="ml-auto text-xs" style={{ color: "#8a7d68" }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Chip({ children, onRemove, variant }: {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: "root";
}) {
  const styles = variant === "root"
    ? { background: "rgba(45,93,79,0.12)", color: "#2d5d4f", border: "1px solid rgba(45,93,79,0.3)" }
    : { background: "#ece2c8", color: "#3d362c", border: "1px solid #d9cfb6" };
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

function VerseCard({
  verse, tags, hasNote, isSelected, onSelect, onWordClick, selectedWordIdx, activeRoot, onRootClick,
}: {
  verse: Verse;
  tags: string[];
  hasNote: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onWordClick: (idx: number) => void;
  selectedWordIdx: number | null;
  activeRoot: string | null;
  onRootClick: (root: string) => void;
}) {
  return (
    <article
      onClick={onSelect}
      className="rounded-sm cursor-pointer transition-all"
      style={{
        background: isSelected ? "#fdfaf0" : "#fbf6e8",
        border: "1px solid " + (isSelected ? "#2d5d4f" : "#d9cfb6"),
        boxShadow: isSelected ? "0 1px 0 #2d5d4f, 0 4px 12px rgba(45,93,79,0.08)" : "none",
      }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center gap-3" style={{ borderBottom: "1px solid #ece2c8" }}>
        <div className="px-2 py-0.5 rounded-sm text-xs font-mono" style={{ background: "#2d5d4f", color: "#f5efe2", letterSpacing: "0.05em" }}>
          {verse.surah}:{verse.ayah}
        </div>
        <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "#3d362c" }}>
          {verse.surahName}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {tags.map((t) => <Chip key={t}>{t}</Chip>)}
          {hasNote && (
            <span title="توجد ملاحظة" style={{ color: "#2d5d4f" }}>
              <FileText size={14} />
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-6" dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 32, lineHeight: 2, color: "#1a1612", textAlign: "right" }}>
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
        {Array.from(new Set(verse.words.map((w) => w.root).filter((r): r is string => r !== null))).map((r) => (
          <button
            key={r}
            onClick={(e) => { e.stopPropagation(); onRootClick(r); }}
            className="px-2 py-0.5 rounded-sm text-xs transition-colors"
            style={{
              background: activeRoot === r ? "rgba(45,93,79,0.18)" : "transparent",
              border: "1px solid " + (activeRoot === r ? "#2d5d4f" : "#d9cfb6"),
              color: "#3d362c",
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

function DetailPanel({
  verse, wordSel, tags, note, allTagSuggestions, onAddTag, onRemoveTag, onSetNote, onRootClick,
}: {
  verse: Verse | null;
  wordSel: { verseId: string; idx: number } | null;
  tags: string[];
  note: string;
  allTagSuggestions: string[];
  onAddTag: (verseId: string, tag: string) => void;
  onRemoveTag: (verseId: string, tag: string) => void;
  onSetNote: (verseId: string, note: string) => void;
  onRootClick: (root: string) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTagInput(""); }, [verse?.id]);

  if (!verse) {
    return (
      <div className="rounded-sm p-6" style={{ background: "#fdfaf0", border: "1px dashed #d9cfb6" }}>
        <Bookmark size={20} style={{ color: "#8a7d68" }} />
        <p className="mt-3" style={{ fontFamily: "'Amiri', serif", fontSize: 20, color: "#3d362c" }} dir="rtl">
          اختر آية للتفصيل.
        </p>
        <p className="text-xs mt-1" style={{ color: "#8a7d68" }} dir="rtl">
          انقر على أي آية لعرض تفاصيل كلماتها، وإضافة وسوم، أو تدوين ملاحظة.
        </p>
      </div>
    );
  }

  const word: Word | null = wordSel?.verseId === verse.id ? verse.words[wordSel.idx] : null;
  const matchingSuggestions = tagInput.trim()
    ? allTagSuggestions.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)).slice(0, 5)
    : allTagSuggestions.filter((t) => !tags.includes(t)).slice(0, 5);

  const submitTag = (val?: string) => {
    onAddTag(verse.id, val ?? tagInput);
    setTagInput("");
    setShowSuggest(false);
  };

  return (
    <div className="rounded-sm overflow-hidden" style={{ background: "#fdfaf0", border: "1px solid #d9cfb6" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #ece2c8", background: "#fbf6e8" }}>
        <div className="text-xs font-mono" style={{ color: "#2d5d4f", letterSpacing: "0.05em" }}>
          {verse.surah}:{verse.ayah}
        </div>
        <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: "#1a1612", marginTop: 2 }}>
          سورة {verse.surahName}
        </div>
      </div>

      {/* Word inspector */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #ece2c8" }}>
        <div className="flex items-center gap-2 mb-3">
          <Type size={13} style={{ color: "#6b6052" }} />
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "#3d362c", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
            {word ? "الكلمة" : "مُفتِّش الكلمات"}
          </h3>
        </div>
        {word ? (
          <div>
            <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 42, lineHeight: 1.4, color: "#1a1612" }}>
              {word.ar}
            </div>
            <div className="text-sm italic mt-1" style={{ color: "#5c5247" }}>{word.tr}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="uppercase tracking-wider mb-1" style={{ color: "#8a7d68", letterSpacing: "0.1em" }} dir="rtl">اللمّة</div>
                <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "#1a1612" }}>{word.lemma || "—"}</div>
              </div>
              <div>
                <div className="uppercase tracking-wider mb-1" style={{ color: "#8a7d68", letterSpacing: "0.1em" }} dir="rtl">الجذر</div>
                {word.root ? (
                  <button
                    onClick={() => onRootClick(word.root!)}
                    className="px-2 py-1 rounded-sm transition-colors"
                    style={{ background: "rgba(45,93,79,0.1)", border: "1px solid rgba(45,93,79,0.3)" }}
                  >
                    <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "#2d5d4f", fontWeight: 600 }}>{word.root}</span>
                  </button>
                ) : <span style={{ color: "#8a7d68" }}>—</span>}
              </div>
            </div>
            {word.root && ROOT_GLOSS[word.root] && (
              <div className="mt-3 text-xs italic px-3 py-2 rounded-sm" style={{ color: "#5c5247", background: "#fbf6e8" }} dir="rtl">
                {ROOT_GLOSS[word.root]}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs italic" style={{ color: "#8a7d68" }} dir="rtl">
            انقر على أي كلمة عربية لعرض جذرها ولمّها.
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #ece2c8" }}>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={13} style={{ color: "#6b6052" }} />
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "#3d362c", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
            الوسوم
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.length === 0 && <span className="text-xs italic" style={{ color: "#8a7d68" }} dir="rtl">لا وسوم بعد.</span>}
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
              style={{ background: "#fbf6e8", border: "1px solid #d9cfb6", fontFamily: "'Amiri', serif" }}
            />
            <button
              onClick={() => submitTag()}
              className="px-3 rounded-sm flex items-center"
              style={{ background: "#2d5d4f", color: "#f5efe2" }}
            >
              <Plus size={14} />
            </button>
          </div>
          {showSuggest && matchingSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 rounded-sm z-10" style={{ background: "#fdfaf0", border: "1px solid #d9cfb6" }}>
              {matchingSuggestions.map((t) => (
                <button
                  key={t}
                  onMouseDown={(e) => { e.preventDefault(); submitTag(t); }}
                  className="w-full text-right px-3 py-1.5 text-xs hover:bg-[#ece2c8]"
                  style={{ color: "#3d362c" }}
                  dir="rtl"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={13} style={{ color: "#6b6052" }} />
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "#3d362c", fontWeight: 600, letterSpacing: "0.1em" }} dir="rtl">
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
            background: "#fbf6e8",
            border: "1px solid #d9cfb6",
            fontFamily: "'Amiri', serif",
            fontSize: 16,
            lineHeight: 1.7,
            color: "#1a1612",
          }}
        />
      </div>
    </div>
  );
}

export default App;
