import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Tag, X, BookOpen, Hash, FileText, Plus, Filter, Bookmark, Type, Loader2 } from "lucide-react";
import type { Verse, Word, SurahMeta, SurahData } from "./types";
import { ROOT_GLOSS } from "./data/verses";
import { norm } from "./data/helpers";

interface SearchEntry {
  id: string;
  surah: number;
  ayah: number;
  name: string;
  arabic: string;
  roots: string[];
}

declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

function App() {
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
  const [surahIndex, setSurahIndex] = useState<SurahMeta[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [surahLoading, setSurahLoading] = useState(false);
  const [, setPendingVerseId] = useState<string | null>(null);

  const [userTags, setUserTags] = useState<Record<string, string[]>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ verseId: string; idx: number } | null>(null);

  // Load surah index + search index once
  useEffect(() => {
    fetch("/data/index.json").then(r => r.json()).then(setSurahIndex).catch(() => {});
    fetch("/data/search-index.json").then(r => r.json()).then(setSearchIndex).catch(() => {});
  }, []);

  // Load surah data when selection changes
  useEffect(() => {
    setSurahLoading(true);
    setSurahData(null);
    setSelectedId(null);
    setSelectedWord(null);
    setActiveRoot(null);
    fetch(`/data/surah-${selectedSurahId}.json`)
      .then(r => r.json())
      .then((d: SurahData) => {
        setSurahData(d);
        setSurahLoading(false);
        // If we navigated here from a global search result, select that verse
        setPendingVerseId(p => { if (p) setSelectedId(p); return null; });
      })
      .catch(() => setSurahLoading(false));
  }, [selectedSurahId]);

  // Hydrate persisted state
  useEffect(() => {
    (async () => {
      try {
        let tags: Record<string, string[]> = {};
        let notes: Record<string, string> = {};
        try { const t = await window.storage?.get("quran:tags"); if (t?.value) tags = JSON.parse(t.value); } catch (_) {}
        try { const n = await window.storage?.get("quran:notes"); if (n?.value) notes = JSON.parse(n.value); } catch (_) {}
        setUserTags(tags);
        setUserNotes(notes);
      } catch { setStorageError("التخزين غير متاح؛ ستبقى الوسوم والملاحظات فقط طوال هذه الجلسة."); }
      finally { setStorageReady(true); }
    })();
  }, []);

  useEffect(() => { if (!storageReady) return; window.storage?.set("quran:tags", JSON.stringify(userTags)).catch(() => {}); }, [userTags, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage?.set("quran:notes", JSON.stringify(userNotes)).catch(() => {}); }, [userNotes, storageReady]);

  const verses = surahData?.verses ?? [];

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(userTags).forEach(arr => arr.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [userTags]);

  const allRoots = useMemo(() => {
    const counts: Record<string, number> = {};
    verses.forEach(v => v.words.forEach(w => { if (w.root) counts[w.root] = (counts[w.root] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [verses]);

  // Global search across full Quran (only when query has at least 2 chars)
  const globalResults = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || !searchIndex.length) return null; // null = not in global search mode
    const qNorm = norm(q);
    const refMatch = q.match(/^(\d+):(\d+)$/);
    return searchIndex.filter(e => {
      if (refMatch) return e.surah === +refMatch[1] && e.ayah === +refMatch[2];
      if (activeRoot && !e.roots.includes(activeRoot)) return false;
      const hitAr = norm(e.arabic).includes(qNorm);
      const hitRoot = e.roots.some(r => r.includes(q));
      return hitAr || hitRoot;
    });
  }, [query, searchIndex, activeRoot]);

  // Browse mode: filter within the loaded surah (no query active)
  const filtered = useMemo(() => {
    if (query.trim()) return []; // handled by globalResults
    return verses.filter(v => {
      if (activeRoot && !v.words.some(w => w.root === activeRoot)) return false;
      if (activeTags.length) { const tags = userTags[v.id] || []; if (!activeTags.every(t => tags.includes(t))) return false; }
      return true;
    });
  }, [verses, query, activeRoot, activeTags, userTags]);

  const selectedVerse = useMemo(() => verses.find(v => v.id === selectedId) ?? null, [verses, selectedId]);

  const addTag = (verseId: string, tag: string) => { const t = tag.trim(); if (!t) return; setUserTags(p => { const c = p[verseId] || []; if (c.includes(t)) return p; return { ...p, [verseId]: [...c, t] }; }); };
  const removeTag = (verseId: string, tag: string) => { setUserTags(p => { const c = (p[verseId] || []).filter(x => x !== tag); const n = { ...p }; if (c.length) n[verseId] = c; else delete n[verseId]; return n; }); };
  const setNote = (verseId: string, note: string) => { setUserNotes(p => { const n = { ...p }; if (note.trim()) n[verseId] = note; else delete n[verseId]; return n; }); };
  const toggleActiveTag = (t: string) => setActiveTags(c => c.includes(t) ? c.filter(x => x !== t) : [...c, t]);
  const handleRootClick = (root: string) => { setActiveRoot(root); setSelectedWord(null); };
  const clearFilters = () => { setQuery(""); setActiveTags([]); setActiveRoot(null); };

  const navigateToVerse = (entry: SearchEntry) => {
    setPendingVerseId(entry.id);
    if (selectedSurahId === entry.surah) {
      // Surah already loaded — select directly
      setSelectedId(entry.id);
      setPendingVerseId(null);
    } else {
      setSelectedSurahId(entry.surah);
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#f5efe2", backgroundImage: "radial-gradient(1200px 600px at 0% 0%, rgba(45,93,79,0.06), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(140,80,30,0.05), transparent 60%)", color: "#1a1612", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <FontStyles />

      <header className="border-b" style={{ borderColor: "#d9cfb6", background: "rgba(253,250,240,0.7)", backdropFilter: "blur(10px)" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "#2d5d4f", color: "#f5efe2" }}>
              <BookOpen size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 24, lineHeight: 1 }}>مِشكَاة</h1>
              <p className="text-xs mt-0.5" style={{ color: "#6b6052", letterSpacing: "0.05em" }}>مِنصَّةُ البَحثِ القُرآنِي</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-auto relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7d68" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="ابحث بالعربية، أو بالجذر (مثال: ك ت ب)، أو بالمرجع (2:255)…"
              dir="rtl" className="w-full pr-10 pl-4 py-2.5 rounded-sm outline-none text-sm"
              style={{ background: "#fdfaf0", border: "1px solid #d9cfb6", fontFamily: "'Amiri', serif", fontSize: 16 }} />
          </div>

          <div className="text-xs" style={{ color: "#6b6052" }}>
            <span style={{ fontWeight: 600, color: "#1a1612" }}>{globalResults ? globalResults.length : filtered.length}</span>
            <span className="mx-1">/</span>
            <span>{globalResults ? `${searchIndex.length} آية` : `${verses.length} آية`}</span>
          </div>
        </div>
        {storageError && <div className="max-w-[1400px] mx-auto px-6 pb-3 text-xs" style={{ color: "#8a4a1a" }} dir="rtl">{storageError}</div>}
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 grid gap-6" style={{ gridTemplateColumns: "260px 1fr 360px" }}>
        <aside className="space-y-6">
          {/* Surah picker */}
          <Section title="السور" icon={<BookOpen size={14} />}>
            <div className="space-y-0.5 max-h-[320px] overflow-y-auto custom-scroll">
              {surahIndex.map(s => (
                <button key={s.id} onClick={() => setSelectedSurahId(s.id)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm transition-colors text-right"
                  style={{ background: selectedSurahId === s.id ? "#2d5d4f" : "transparent", color: selectedSurahId === s.id ? "#f5efe2" : "#3d362c" }}
                  onMouseEnter={e => { if (selectedSurahId !== s.id) e.currentTarget.style.background = "#ece2c8"; }}
                  onMouseLeave={e => { if (selectedSurahId !== s.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="text-xs" style={{ opacity: 0.7 }}>{s.totalVerses}</span>
                  <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 16 }}>{s.name}</span>
                  <span className="text-xs font-mono" style={{ opacity: 0.6, minWidth: 20, textAlign: "left" }}>{s.id}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Filters */}
          <Section title="التصفية" icon={<Filter size={14} />}>
            {(activeTags.length > 0 || activeRoot || query) ? (
              <button onClick={clearFilters} className="text-xs underline-offset-2 hover:underline" style={{ color: "#2d5d4f" }} dir="rtl">مسح جميع التصفيات</button>
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

          {/* Tags */}
          <Section title="وسوماتك" icon={<Tag size={14} />} count={allTags.length}>
            {allTags.length === 0 ? (
              <p className="text-xs italic" style={{ color: "#8a7d68" }} dir="rtl">سمِّ آية لبناء تصنيفك.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(([t, c]) => (
                  <button key={t} onClick={() => toggleActiveTag(t)} className="px-2 py-1 rounded-sm text-xs transition-colors"
                    style={{ background: activeTags.includes(t) ? "#2d5d4f" : "#ece2c8", color: activeTags.includes(t) ? "#f5efe2" : "#3d362c", border: "1px solid " + (activeTags.includes(t) ? "#2d5d4f" : "#d9cfb6") }}>
                    {t} <span style={{ opacity: 0.7 }}>· {c}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Roots */}
          <Section title="الجذور في السورة" icon={<Hash size={14} />} count={allRoots.length}>
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 custom-scroll">
              {allRoots.map(([r, c]) => (
                <button key={r} onClick={() => handleRootClick(r)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm transition-colors"
                  style={{ background: activeRoot === r ? "#2d5d4f" : "transparent", color: activeRoot === r ? "#f5efe2" : "#3d362c" }}
                  onMouseEnter={e => { if (activeRoot !== r) e.currentTarget.style.background = "#ece2c8"; }}
                  onMouseLeave={e => { if (activeRoot !== r) e.currentTarget.style.background = "transparent"; }}>
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

        {/* Center */}
        <main className="space-y-4 min-w-0">
          {globalResults ? (
            // Global search results
            globalResults.length === 0 ? (
              <div className="rounded-sm p-10 text-center" style={{ background: "#fdfaf0", border: "1px dashed #d9cfb6" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#5c5247" }}>لا توجد نتائج مطابقة.</p>
              </div>
            ) : (
              globalResults.map(e => (
                <SearchResultCard key={e.id} entry={e} activeRoot={activeRoot}
                  isSelected={selectedId === e.id}
                  onSelect={() => navigateToVerse(e)} />
              ))
            )
          ) : surahLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin" style={{ color: "#2d5d4f" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-sm p-10 text-center" style={{ background: "#fdfaf0", border: "1px dashed #d9cfb6" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#5c5247" }}>لا توجد نتائج مطابقة.</p>
              <p className="text-xs mt-2" style={{ color: "#8a7d68" }} dir="rtl">جرِّب مسح التصفيات أو ابحث بجذر معروف مثل <span style={{ fontFamily: "'Amiri', serif" }}>ر ح م</span></p>
            </div>
          ) : (
            filtered.map(v => (
              <VerseCard key={v.id} verse={v} tags={userTags[v.id] || []} hasNote={!!userNotes[v.id]}
                isSelected={selectedId === v.id} onSelect={() => setSelectedId(v.id)}
                onWordClick={idx => { setSelectedId(v.id); setSelectedWord({ verseId: v.id, idx }); }}
                selectedWordIdx={selectedWord?.verseId === v.id ? selectedWord.idx : null}
                activeRoot={activeRoot} onRootClick={handleRootClick} />
            ))
          )}
        </main>

        {/* Right */}
        <aside>
          <DetailPanel verse={selectedVerse} wordSel={selectedWord}
            tags={selectedVerse ? (userTags[selectedVerse.id] || []) : []}
            note={selectedVerse ? (userNotes[selectedVerse.id] || "") : ""}
            allTagSuggestions={allTags.map(([t]) => t)}
            onAddTag={addTag} onRemoveTag={removeTag} onSetNote={setNote} onRootClick={handleRootClick}
            surahName={surahData?.name ?? ""} />
        </aside>
      </div>

      <footer className="max-w-[1400px] mx-auto px-6 py-8 text-xs" style={{ color: "#8a7d68" }} dir="rtl">
        بيانات الشكل القرآني: مشروع التنزيل (CC BY-ND 3.0). بيانات الصرف والجذور: مدوّنة القرآن العربي — Kais Dukes (GPL v3).{" "}
        <a href="http://corpus.quran.com" style={{ color: "#2d5d4f" }}>corpus.quran.com</a>
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
  verse, wordSel, tags, note, allTagSuggestions, onAddTag, onRemoveTag, onSetNote, onRootClick, surahName,
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
  surahName: string;
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
          سورة {surahName}
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
            {word.tr && <div className="text-sm italic mt-1" style={{ color: "#5c5247" }}>{word.tr}</div>}
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

function SearchResultCard({ entry, activeRoot, isSelected, onSelect }: {
  entry: SearchEntry;
  activeRoot: string | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <article onClick={onSelect} className="rounded-sm cursor-pointer transition-all"
      style={{
        background: isSelected ? "#fdfaf0" : "#fbf6e8",
        border: "1px solid " + (isSelected ? "#2d5d4f" : "#d9cfb6"),
        boxShadow: isSelected ? "0 1px 0 #2d5d4f, 0 4px 12px rgba(45,93,79,0.08)" : "none",
      }}>
      <div className="px-5 pt-4 pb-2 flex items-center gap-3" style={{ borderBottom: "1px solid #ece2c8" }}>
        <div className="px-2 py-0.5 rounded-sm text-xs font-mono" style={{ background: "#2d5d4f", color: "#f5efe2", letterSpacing: "0.05em" }}>
          {entry.surah}:{entry.ayah}
        </div>
        <div dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 16, color: "#3d362c" }}>{entry.name}</div>
      </div>
      <div className="px-5 py-5" dir="rtl"
        style={{ fontFamily: "'Amiri', serif", fontSize: 28, lineHeight: 2, color: "#1a1612", textAlign: "right" }}>
        {entry.arabic}
      </div>
      {entry.roots.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5" dir="rtl">
          {entry.roots.map(r => (
            <span key={r} className="px-2 py-0.5 rounded-sm text-xs"
              style={{
                background: activeRoot === r ? "rgba(45,93,79,0.18)" : "transparent",
                border: "1px solid " + (activeRoot === r ? "#2d5d4f" : "#d9cfb6"),
                color: "#3d362c",
              }}>
              <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 13, fontWeight: 600 }}>{r}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default App;
