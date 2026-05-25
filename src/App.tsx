import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Tag, BookOpen, Filter, Bookmark, Loader2, ArrowRight } from "lucide-react";
import type { SurahMeta, SurahData } from "./types";
import { ROOT_GLOSS } from "./data/verses";
import { norm } from "./data/helpers";
import { STORAGE_KEYS, DATA_URLS, SCROLL_TRIGGER_PX, QUERY_ROOTS_LIMIT } from "./lib/constants";
import { loadJSON, saveJSON, loadString, saveString } from "./lib/storage";
import { Section } from "./components/Section";
import { Chip } from "./components/Chip";
import { FontStyles } from "./components/FontStyles";
import { ThemeToggle, type Theme } from "./features/theme/ThemeToggle";
import { Breadcrumb } from "./features/navigation/Breadcrumb";
import { ScrollToTopButton } from "./features/navigation/ScrollToTopButton";
import { VerseCard } from "./features/verses/VerseCard";
import { DetailPanel } from "./features/verses/DetailPanel";
import { SearchResultCard } from "./features/search/SearchResultCard";
import type { SearchEntry, RootReturnTarget } from "./features/search/types";

function App() {
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
  const [surahIndex, setSurahIndex] = useState<SurahMeta[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [surahLoading, setSurahLoading] = useState(false);
  const pendingNavRef = useRef<{ verseId: string; wordIdx: number | null } | null>(null);

  const [userTags, setUserTags] = useState<Record<string, string[]>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [rootReturnTo, setRootReturnTo] = useState<RootReturnTarget | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ verseId: string; idx: number } | null>(null);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage?.getItem(STORAGE_KEYS.theme);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveString(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      const t = await loadString(STORAGE_KEYS.theme);
      if (t === "light" || t === "dark") setTheme(t);
    })();
  }, []);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_TRIGGER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch(DATA_URLS.surahIndex).then(r => r.json()).then(setSurahIndex).catch(() => {});
    fetch(DATA_URLS.searchIndex).then(r => r.json()).then(setSearchIndex).catch(() => {});
  }, []);

  // Sync transient view state with the externally driven surah fetch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSurahLoading(true);
    setSurahData(null);
    setSelectedId(null);
    setSelectedWord(null);
    setActiveRoot(null);
    setRootReturnTo(null);
    fetch(DATA_URLS.surah(selectedSurahId))
      .then(r => r.json())
      .then((d: SurahData) => {
        setSurahData(d);
        setSurahLoading(false);
        const nav = pendingNavRef.current;
        if (nav) {
          setSelectedId(nav.verseId);
          if (nav.wordIdx != null) setSelectedWord({ verseId: nav.verseId, idx: nav.wordIdx });
          pendingNavRef.current = null;
        }
      })
      .catch(() => setSurahLoading(false));
  }, [selectedSurahId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    (async () => {
      try {
        const [tags, notes] = await Promise.all([
          loadJSON<Record<string, string[]>>(STORAGE_KEYS.tags, {}),
          loadJSON<Record<string, string>>(STORAGE_KEYS.notes, {}),
        ]);
        setUserTags(tags);
        setUserNotes(notes);
      } catch {
        setStorageError("التخزين غير متاح؛ ستبقى الوسوم والملاحظات فقط طوال هذه الجلسة.");
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  useEffect(() => { if (storageReady) saveJSON(STORAGE_KEYS.tags, userTags); }, [userTags, storageReady]);
  useEffect(() => { if (storageReady) saveJSON(STORAGE_KEYS.notes, userNotes); }, [userNotes, storageReady]);

  const verses = useMemo(() => surahData?.verses ?? [], [surahData]);

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(userTags).forEach(arr => arr.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [userTags]);

  const globalResults = useMemo(() => {
    const q = query.trim();
    if (!searchIndex.length) return null;
    if (q.length < 2 && !activeRoot) return null;
    if (!q && activeRoot) return searchIndex.filter(e => e.roots.includes(activeRoot));
    const refMatch = q.match(/^(\d+):(\d+)$/);
    const terms = q.split(/\s+/).filter(Boolean);
    const isMultiWord = terms.length > 1 && terms.every(t => t.length >= 2);

    return searchIndex.filter(e => {
      if (refMatch) return e.surah === +refMatch[1] && e.ayah === +refMatch[2];
      if (activeRoot && !e.roots.includes(activeRoot)) return false;
      if (isMultiWord) {
        return terms.every(t => {
          const tn = norm(t);
          return norm(e.arabic).includes(tn) || e.roots.some(r => r.includes(t));
        });
      }
      return norm(e.arabic).includes(norm(q)) || e.roots.some(r => r.includes(q));
    });
  }, [query, searchIndex, activeRoot]);

  const filtered = useMemo(() => {
    if (query.trim()) return [];
    return verses.filter(v => {
      if (activeRoot && !v.words.some(w => w.root === activeRoot)) return false;
      if (activeTags.length) { const tags = userTags[v.id] || []; if (!activeTags.every(t => tags.includes(t))) return false; }
      return true;
    });
  }, [verses, query, activeRoot, activeTags, userTags]);

  const selectedVerse = useMemo(() => verses.find(v => v.id === selectedId) ?? null, [verses, selectedId]);

  const selectedWordRoot = useMemo(() => {
    if (!selectedWord || !selectedVerse) return null;
    return selectedVerse.words[selectedWord.idx]?.root ?? null;
  }, [selectedWord, selectedVerse]);

  const queryRoots = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || !searchIndex.length) return [];
    const terms = q.split(/\s+/).map(t => norm(t)).filter(t => t.length >= 2);
    if (!terms.length) return [];
    const counts: Record<string, number> = {};
    for (const e of searchIndex) {
      const tokens = e.arabic.split(" ");
      for (let i = 0; i < tokens.length; i++) {
        const root = e.wordRoots[i];
        if (!root) continue;
        const w = norm(tokens[i]);
        if (terms.some(t => w.includes(t))) counts[root] = (counts[root] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, QUERY_ROOTS_LIMIT);
  }, [query, searchIndex]);

  const addTag = (verseId: string, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setUserTags(p => {
      const c = p[verseId] || [];
      if (c.includes(t)) return p;
      return { ...p, [verseId]: [...c, t] };
    });
  };
  const removeTag = (verseId: string, tag: string) => {
    setUserTags(p => {
      const c = (p[verseId] || []).filter(x => x !== tag);
      const n = { ...p };
      if (c.length) n[verseId] = c; else delete n[verseId];
      return n;
    });
  };
  const setNote = (verseId: string, note: string) => {
    setUserNotes(p => {
      const n = { ...p };
      if (note.trim()) n[verseId] = note; else delete n[verseId];
      return n;
    });
  };
  const toggleActiveTag = (t: string) =>
    setActiveTags(c => c.includes(t) ? c.filter(x => x !== t) : [...c, t]);

  const handleRootClick = (root: string, from?: RootReturnTarget) => {
    setActiveRoot(root);
    setSelectedWord(null);
    setRootReturnTo(from ?? null);
  };

  const returnFromRoot = () => {
    if (!rootReturnTo) { setActiveRoot(null); return; }
    const { surahId, verseId, wordIdx } = rootReturnTo;
    setActiveRoot(null);
    if (selectedSurahId === surahId) {
      setSelectedId(verseId);
      if (wordIdx != null) setSelectedWord({ verseId, idx: wordIdx });
    } else {
      pendingNavRef.current = { verseId, wordIdx };
      setSelectedSurahId(surahId);
    }
    setRootReturnTo(null);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveTags([]);
    setActiveRoot(null);
    setRootReturnTo(null);
  };

  const navigateToVerse = (entry: SearchEntry) => {
    if (selectedSurahId === entry.surah) {
      setSelectedId(entry.id);
    } else {
      pendingNavRef.current = { verseId: entry.id, wordIdx: null };
      setSelectedSurahId(entry.surah);
    }
  };

  const breadcrumbMode: "browse" | "search" | "root" | null = query.trim() && globalResults
    ? "search"
    : activeRoot && globalResults
      ? "root"
      : surahData
        ? "browse"
        : null;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "var(--bg)",
        backgroundImage: "radial-gradient(1200px 600px at 0% 0%, rgb(var(--accent-rgb) / 0.06), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgb(var(--accent2-rgb) / 0.05), transparent 60%)",
        color: "var(--text)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <FontStyles />

      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--header-bg)", backdropFilter: "blur(10px)" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--accent)", color: "var(--bg)" }}>
              <BookOpen size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 24, lineHeight: 1 }}>مِشكَاة</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-4)", letterSpacing: "0.05em" }}>مِنصَّةُ البَحثِ القُرآنِي</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-auto relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-5)" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث بالعربية، أو بالجذر (مثال: ك ت ب)، أو بالمرجع (2:255)…"
              dir="rtl"
              className="w-full pr-10 pl-4 py-2.5 rounded-sm outline-none text-sm"
              style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", fontFamily: "'Amiri', serif", fontSize: 16 }}
            />
          </div>

          <div className="text-xs" style={{ color: "var(--text-4)" }}>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>{globalResults ? globalResults.length : filtered.length}</span>
            <span className="mx-1">/</span>
            <span>{globalResults ? `${searchIndex.length} آية` : `${verses.length} آية`}</span>
          </div>

          <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === "dark" ? "light" : "dark")} />
        </div>
        {storageError && (
          <div className="max-w-[1400px] mx-auto px-6 pb-3 text-xs" style={{ color: "var(--warn)" }} dir="rtl">
            {storageError}
          </div>
        )}
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 grid gap-6" style={{ gridTemplateColumns: "260px 1fr 360px" }}>
        <aside className="space-y-6">
          <Section title="السور" icon={<BookOpen size={14} />}>
            <div className="space-y-0.5 max-h-[320px] overflow-y-auto custom-scroll">
              {surahIndex.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSurahId(s.id)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm transition-colors text-right"
                  style={{ background: selectedSurahId === s.id ? "var(--accent)" : "transparent", color: selectedSurahId === s.id ? "var(--bg)" : "var(--text-2)" }}
                  onMouseEnter={e => { if (selectedSurahId !== s.id) e.currentTarget.style.background = "var(--bg-muted)"; }}
                  onMouseLeave={e => { if (selectedSurahId !== s.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="text-xs" style={{ opacity: 0.7 }}>{s.totalVerses}</span>
                  <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 16 }}>{s.name}</span>
                  <span className="text-xs font-mono" style={{ opacity: 0.6, minWidth: 20, textAlign: "left" }}>{s.id}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="التصفية" icon={<Filter size={14} />}>
            {(activeTags.length > 0 || activeRoot || query) ? (
              <button onClick={clearFilters} className="text-xs underline-offset-2 hover:underline" style={{ color: "var(--accent)" }} dir="rtl">
                مسح جميع التصفيات
              </button>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--text-5)" }} dir="rtl">لا توجد تصفية نشطة.</p>
            )}
            {activeRoot && (
              <div className="mt-2 flex items-center gap-2 text-xs" dir="rtl">
                <span style={{ color: "var(--text-4)" }}>الجذر:</span>
                <Chip onRemove={() => { setActiveRoot(null); setRootReturnTo(null); }} variant="root">
                  <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 14 }}>{activeRoot}</span>
                </Chip>
              </div>
            )}
            {rootReturnTo && (
              <button
                onClick={returnFromRoot}
                className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs transition-colors"
                style={{ background: "var(--bg-muted)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgb(var(--accent-rgb) / 0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
                dir="rtl"
                title={`العودة إلى ${rootReturnTo.verseId}`}
              >
                <ArrowRight size={12} strokeWidth={1.75} />
                <span>الرجوع إلى الآية {rootReturnTo.verseId}</span>
              </button>
            )}
          </Section>

          {(selectedWordRoot || queryRoots.length > 0) && (
            <Section title="الجذور" icon={<Bookmark size={14} />} count={selectedWordRoot ? undefined : queryRoots.length}>
              {selectedWordRoot && (
                <div className="mb-2">
                  <div className="text-xs mb-1.5" style={{ color: "var(--text-4)" }} dir="rtl">جذر الكلمة المحددة</div>
                  <button
                    onClick={() => handleRootClick(
                      selectedWordRoot,
                      selectedVerse ? { surahId: selectedVerse.surah, verseId: selectedVerse.id, wordIdx: selectedWord?.idx ?? null } : undefined,
                    )}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm transition-colors"
                    style={{
                      background: activeRoot === selectedWordRoot ? "var(--accent)" : "rgb(var(--accent-rgb) / 0.1)",
                      color: activeRoot === selectedWordRoot ? "var(--bg)" : "var(--text-2)",
                      border: "1px solid " + (activeRoot === selectedWordRoot ? "var(--accent)" : "rgb(var(--accent-rgb) / 0.3)"),
                    }}
                    dir="rtl"
                  >
                    <span className="text-xs italic" style={{ opacity: 0.85 }}>{ROOT_GLOSS[selectedWordRoot]?.split("،")[0] ?? ""}</span>
                    <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, fontWeight: 600 }}>{selectedWordRoot}</span>
                  </button>
                </div>
              )}
              {queryRoots.length > 0 && (
                <div>
                  {selectedWordRoot && <div className="text-xs mb-1.5 mt-2" style={{ color: "var(--text-4)" }} dir="rtl">جذور كلمات البحث</div>}
                  <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 custom-scroll">
                    {queryRoots.map(([r, c]) => (
                      <button
                        key={r}
                        onClick={() => handleRootClick(r)}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm transition-colors"
                        style={{ background: activeRoot === r ? "var(--accent)" : "transparent", color: activeRoot === r ? "var(--bg)" : "var(--text-2)" }}
                        onMouseEnter={e => { if (activeRoot !== r) e.currentTarget.style.background = "var(--bg-muted)"; }}
                        onMouseLeave={e => { if (activeRoot !== r) e.currentTarget.style.background = "transparent"; }}
                        dir="rtl"
                      >
                        <span className="flex items-center gap-2 text-xs" style={{ opacity: 0.8 }}>
                          <span>{c}</span>
                          <span className="italic" style={{ fontSize: 11 }}>{ROOT_GLOSS[r]?.split("،")[0] ?? ""}</span>
                        </span>
                        <span dir="rtl" style={{ fontFamily: "'Amiri', serif", fontSize: 18, fontWeight: 600 }}>{r}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          <Section title="وسوماتك" icon={<Tag size={14} />} count={allTags.length}>
            {allTags.length === 0 ? (
              <p className="text-xs italic" style={{ color: "var(--text-5)" }} dir="rtl">سمِّ آية لبناء تصنيفك.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(([t, c]) => (
                  <button
                    key={t}
                    onClick={() => toggleActiveTag(t)}
                    className="px-2 py-1 rounded-sm text-xs transition-colors"
                    style={{
                      background: activeTags.includes(t) ? "var(--accent)" : "var(--bg-muted)",
                      color: activeTags.includes(t) ? "var(--bg)" : "var(--text-2)",
                      border: "1px solid " + (activeTags.includes(t) ? "var(--accent)" : "var(--border)"),
                    }}
                  >
                    {t} <span style={{ opacity: 0.7 }}>· {c}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </aside>

        <main className="space-y-4 min-w-0">
          {globalResults ? (
            globalResults.length === 0 ? (
              <EmptyState message="لا توجد نتائج مطابقة." />
            ) : (
              globalResults.map(e => (
                <SearchResultCard
                  key={e.id}
                  entry={e}
                  activeRoot={activeRoot}
                  isSelected={selectedId === e.id}
                  onSelect={() => navigateToVerse(e)}
                />
              ))
            )
          ) : surahLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              message="لا توجد نتائج مطابقة."
              hint={<>جرِّب مسح التصفيات أو ابحث بجذر معروف مثل <span style={{ fontFamily: "'Amiri', serif" }}>ر ح م</span></>}
            />
          ) : (
            filtered.map(v => (
              <VerseCard
                key={v.id}
                verse={v}
                tags={userTags[v.id] || []}
                hasNote={!!userNotes[v.id]}
                isSelected={selectedId === v.id}
                onSelect={() => setSelectedId(v.id)}
                onWordClick={idx => { setSelectedId(v.id); setSelectedWord({ verseId: v.id, idx }); }}
                selectedWordIdx={selectedWord?.verseId === v.id ? selectedWord.idx : null}
                activeRoot={activeRoot}
                onRootClick={handleRootClick}
              />
            ))
          )}
        </main>

        <aside>
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
            surahName={surahData?.name ?? ""}
          />
        </aside>
      </div>

      <Breadcrumb
        visible={scrolled}
        mode={breadcrumbMode}
        query={query.trim()}
        activeRoot={activeRoot}
        surahName={surahData?.name ?? null}
        resultCount={globalResults ? globalResults.length : filtered.length}
        totalCount={globalResults ? searchIndex.length : verses.length}
        totalUnit="آية"
      />

      <ScrollToTopButton visible={scrolled} />

      <footer className="max-w-[1400px] mx-auto px-6 py-8 text-xs" style={{ color: "var(--text-5)" }} dir="rtl">
        بيانات الشكل القرآني: مشروع التنزيل (CC BY-ND 3.0). بيانات الصرف والجذور: مدوّنة القرآن العربي — Kais Dukes (GPL v3).{" "}
        <a href="http://corpus.quran.com" style={{ color: "var(--accent)" }}>corpus.quran.com</a>
      </footer>
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-sm p-10 text-center" style={{ background: "var(--bg-elev)", border: "1px dashed var(--border)" }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text-3)" }}>{message}</p>
      {hint && <p className="text-xs mt-2" style={{ color: "var(--text-5)" }} dir="rtl">{hint}</p>}
    </div>
  );
}

export default App;
