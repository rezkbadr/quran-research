import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X, Tag, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { Verse, Word } from './types';
import { VERSES, ROOT_GLOSS } from './data/verses';
import { norm } from './data/helpers';

// ─── Storage helpers ──────────────────────────────────────────────────────────

type StorageData = {
  tags: Record<string, string[]>;
  notes: Record<string, string>;
};

const STORAGE_KEY = 'mishkah_v1';

function loadStorage(): StorageData {
  try {
    const raw = (window as any).storage?.getItem?.(STORAGE_KEY)
      ?? localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StorageData;
  } catch {
    // ignore
  }
  return { tags: {}, notes: {} };
}

function saveStorage(data: StorageData): boolean {
  try {
    const json = JSON.stringify(data);
    if ((window as any).storage?.setItem) {
      (window as any).storage.setItem(STORAGE_KEY, json);
    } else {
      localStorage.setItem(STORAGE_KEY, json);
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Derived data helpers ─────────────────────────────────────────────────────

function getAllRoots(): string[] {
  const rootSet = new Set<string>();
  for (const verse of VERSES) {
    for (const word of verse.words) {
      if (word.root) rootSet.add(word.root);
    }
  }
  return Array.from(rootSet).sort();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface WordChipProps {
  word: Word;
  isSelected: boolean;
  onClick: () => void;
}

function WordChip({ word, isSelected, onClick }: WordChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-block px-1 py-0.5 rounded cursor-pointer transition-colors text-2xl leading-relaxed font-arabic
        ${isSelected
          ? 'bg-amber-200 text-amber-900 ring-2 ring-amber-400'
          : 'hover:bg-amber-50 text-gray-900'}
      `}
      title={word.tr}
      dir="rtl"
    >
      {word.ar}
    </button>
  );
}

interface VerseCardProps {
  verse: Verse;
  isSelected: boolean;
  tags: string[];
  activeRootFilter: string | null;
  onSelect: () => void;
  onRootClick: (root: string) => void;
  selectedWord: Word | null;
  onWordClick: (word: Word) => void;
}

function VerseCard({
  verse,
  isSelected,
  tags,
  activeRootFilter,
  onSelect,
  onRootClick,
  selectedWord,
  onWordClick,
}: VerseCardProps) {
  // Highlight words that match the active root filter
  const highlightRoot = activeRootFilter;

  return (
    <div
      className={`
        rounded-xl border p-4 cursor-pointer transition-all
        ${isSelected
          ? 'border-amber-400 bg-amber-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm'}
      `}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">
          {verse.surah}:{verse.ayah}
        </span>
        <span className="text-sm text-gray-600 font-arabic">{verse.surahName}</span>
      </div>

      {/* Arabic text as clickable words */}
      <div
        className="flex flex-wrap gap-1 mb-2 justify-end"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {verse.words.map((word, i) => (
          <span key={i}>
            {highlightRoot && word.root === highlightRoot ? (
              <WordChip
                word={word}
                isSelected={selectedWord?.ar === word.ar && selectedWord?.tr === word.tr}
                onClick={() => onWordClick(word)}
              />
            ) : (
              <WordChip
                word={word}
                isSelected={selectedWord?.ar === word.ar && selectedWord?.tr === word.tr}
                onClick={() => onWordClick(word)}
              />
            )}
          </span>
        ))}
      </div>

      {/* Root chips */}
      <div className="flex flex-wrap gap-1 justify-end mt-2" onClick={(e) => e.stopPropagation()}>
        {Array.from(new Set(verse.words.map((w) => w.root).filter(Boolean) as string[])).map(
          (root) => (
            <button
              key={root}
              onClick={() => onRootClick(root)}
              className={`
                text-xs px-2 py-0.5 rounded-full border transition-colors font-mono
                ${activeRootFilter === root
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}
              `}
              dir="rtl"
            >
              {root}
            </button>
          )
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 justify-end">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full"
              dir="rtl"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface DetailPanelProps {
  verse: Verse | null;
  tags: string[];
  note: string;
  selectedWord: Word | null;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onNoteChange: (note: string) => void;
  onWordClick: (word: Word) => void;
}

function DetailPanel({
  verse,
  tags,
  note,
  selectedWord,
  onTagAdd,
  onTagRemove,
  onNoteChange,
  onWordClick,
}: DetailPanelProps) {
  const [tagInput, setTagInput] = useState('');

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagAdd(trimmed);
      setTagInput('');
    }
  };

  if (!verse) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
        <BookOpen className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg font-medium mb-2 font-arabic">اختر آية للتفصيل.</p>
        <p className="text-sm font-arabic">انقر على أي آية لعرض تفاصيل كلماتها، وإضافة وسوم، أو تدوين ملاحظة.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full" dir="rtl">
      {/* Verse header */}
      <div className="border-b pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-gray-400">{verse.surah}:{verse.ayah}</span>
          <span className="text-sm font-semibold text-gray-700 font-arabic">
            سورة {verse.surahName}
          </span>
        </div>
        <p className="text-2xl leading-loose text-right font-arabic text-gray-900">
          {verse.arabic}
        </p>
      </div>

      {/* Word inspector */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-arabic">مُفتِّش الكلمات</h3>
        {selectedWord ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-3xl text-right mb-1 font-arabic">{selectedWord.ar}</p>
            <p className="text-sm text-gray-500 italic mb-2 text-right">{selectedWord.tr}</p>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-arabic">اللمّة</span>
                <span className="font-arabic">{selectedWord.lemma}</span>
              </div>
              {selectedWord.root && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-arabic">الجذر</span>
                  <span className="font-mono text-teal-700">{selectedWord.root}</span>
                </div>
              )}
              {selectedWord.root && ROOT_GLOSS[selectedWord.root] && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-arabic">المعنى</span>
                  <span className="text-gray-700 font-arabic text-right">{ROOT_GLOSS[selectedWord.root]}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2 font-arabic">
            انقر على أي كلمة عربية لعرض جذرها ولمّها.
          </p>
        )}
      </div>

      {/* Words clickable list */}
      <div>
        <div className="flex flex-wrap gap-1 justify-end">
          {verse.words.map((word, i) => (
            <WordChip
              key={i}
              word={word}
              isSelected={
                selectedWord?.ar === word.ar && selectedWord?.tr === word.tr && selectedWord?.lemma === word.lemma
              }
              onClick={() => onWordClick(word)}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-arabic">الوسوم</h3>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400 font-arabic">لا وسوم بعد.</p>
        ) : (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-sm bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full"
              >
                <span className="font-arabic">{tag}</span>
                <button
                  onClick={() => onTagRemove(tag)}
                  className="hover:text-violet-900 ml-1"
                  aria-label="حذف الوسم"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <form onSubmit={handleTagSubmit} className="flex gap-2">
          <button
            type="submit"
            className="text-xs bg-violet-600 text-white px-2 py-1 rounded hover:bg-violet-700"
          >
            <Tag className="w-3 h-3" />
          </button>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="مثال: رحمة، أسماء الله، دعاء…"
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 text-right font-arabic"
            dir="rtl"
          />
        </form>
      </div>

      {/* Note */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-arabic">ملاحظة</h3>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="مرجع تفسيري، إحالة مقارنة، تعليقك الخاص…"
          className="w-full text-sm border border-gray-200 rounded px-2 py-2 min-h-[100px] text-right resize-y font-arabic"
          dir="rtl"
        />
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [search, setSearch] = useState('');
  const [activeRootFilter, setActiveRootFilter] = useState<string | null>(null);
  const [activeSurahFilter, setActiveSurahFilter] = useState<number | null>(null);
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [storageData, setStorageData] = useState<StorageData>(() => loadStorage());
  const [storageError, setStorageError] = useState(false);
  const [showRoots, setShowRoots] = useState(false);
  const [showTags, setShowTags] = useState(false);

  // Persist storage
  useEffect(() => {
    const ok = saveStorage(storageData);
    if (!ok) setStorageError(true);
  }, [storageData]);

  // All unique roots
  const allRoots = useMemo(() => getAllRoots(), []);

  // All unique tags from user data
  const allUserTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tags of Object.values(storageData.tags)) {
      for (const tag of tags) tagSet.add(tag);
    }
    return Array.from(tagSet).sort();
  }, [storageData.tags]);

  // Filter verses
  const filteredVerses = useMemo(() => {
    let results = VERSES;

    // Surah filter
    if (activeSurahFilter !== null) {
      results = results.filter((v) => v.surah === activeSurahFilter);
    }

    // Root filter
    if (activeRootFilter) {
      results = results.filter((v) =>
        v.words.some((w) => w.root === activeRootFilter)
      );
    }

    // Search
    const q = search.trim();
    if (q) {
      // Check if it's a reference like 2:255
      const refMatch = /^(\d+):(\d+)$/.exec(q);
      if (refMatch) {
        const s = parseInt(refMatch[1]);
        const a = parseInt(refMatch[2]);
        results = results.filter((v) => v.surah === s && v.ayah === a);
      } else {
        // Check if it looks like a root (space-separated letters)
        const rootPattern = /^[؀-ۿ\s]+$/.test(q) && q.includes(' ');
        if (rootPattern) {
          results = results.filter((v) =>
            v.words.some((w) => w.root === q)
          );
        } else {
          // Arabic text search
          const normQ = norm(q);
          results = results.filter((v) => {
            const normArabic = norm(v.arabic);
            if (normArabic.includes(normQ)) return true;
            if (v.words.some((w) => norm(w.ar).includes(normQ))) return true;
            if (v.words.some((w) => w.tr.toLowerCase().includes(q.toLowerCase()))) return true;
            return false;
          });
        }
      }
    }

    return results;
  }, [search, activeRootFilter, activeSurahFilter]);

  const selectedVerse = useMemo(
    () => VERSES.find((v) => v.id === selectedVerseId) ?? null,
    [selectedVerseId]
  );

  const handleRootClick = useCallback(
    (root: string) => {
      setActiveRootFilter((prev) => (prev === root ? null : root));
    },
    []
  );

  const handleVerseSelect = useCallback((verseId: string) => {
    setSelectedVerseId((prev) => (prev === verseId ? null : verseId));
    setSelectedWord(null);
  }, []);

  const handleTagAdd = useCallback((tag: string) => {
    if (!selectedVerseId) return;
    setStorageData((prev) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [selectedVerseId]: [...(prev.tags[selectedVerseId] ?? []), tag],
      },
    }));
  }, [selectedVerseId]);

  const handleTagRemove = useCallback((tag: string) => {
    if (!selectedVerseId) return;
    setStorageData((prev) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [selectedVerseId]: (prev.tags[selectedVerseId] ?? []).filter((t) => t !== tag),
      },
    }));
  }, [selectedVerseId]);

  const handleNoteChange = useCallback((note: string) => {
    if (!selectedVerseId) return;
    setStorageData((prev) => ({
      ...prev,
      notes: { ...prev.notes, [selectedVerseId]: note },
    }));
  }, [selectedVerseId]);

  const clearAllFilters = () => {
    setActiveRootFilter(null);
    setActiveSurahFilter(null);
    setSearch('');
  };

  const hasFilters = activeRootFilter !== null || activeSurahFilter !== null || search.trim() !== '';

  // Unique surahs in corpus
  const surahs = useMemo(() => {
    const seen = new Map<number, string>();
    for (const v of VERSES) {
      if (!seen.has(v.surah)) seen.set(v.surah, v.surahName);
    }
    return Array.from(seen.entries()).map(([num, name]) => ({ num, name }));
  }, []);

  // Verses per root (for roots panel)
  const rootVerseCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const root of allRoots) {
      counts[root] = VERSES.filter((v) => v.words.some((w) => w.root === root)).length;
    }
    return counts;
  }, [allRoots]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Storage warning */}
      {storageError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center font-arabic">
          التخزين غير متاح؛ ستبقى الوسوم والملاحظات فقط طوال هذه الجلسة.
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-arabic">م</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-arabic">مِشكَاة</h1>
              <p className="text-xs text-gray-500 font-arabic">مِنصَّةُ البَحثِ القُرآنِي</p>
            </div>
          </div>
          {/* Surah filter pills */}
          <div className="flex gap-2">
            {surahs.map(({ num, name }) => (
              <button
                key={num}
                onClick={() =>
                  setActiveSurahFilter((prev) => (prev === num ? null : num))
                }
                className={`text-sm px-3 py-1 rounded-full border transition-colors font-arabic ${
                  activeSurahFilter === num
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-gray-300 text-gray-600 hover:bg-amber-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالعربية، أو بالجذر (مثال: ك ت ب)، أو بالمرجع (2:255)…"
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-right font-arabic focus:outline-none focus:ring-2 focus:ring-amber-300"
              dir="rtl"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-4 flex gap-4">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 flex flex-col gap-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 font-arabic">
              التصفية
            </h2>
            {!hasFilters ? (
              <p className="text-sm text-gray-400 font-arabic">لا توجد تصفية نشطة.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeRootFilter && (
                  <div className="flex items-center justify-between bg-teal-50 rounded px-2 py-1">
                    <button
                      onClick={() => setActiveRootFilter(null)}
                      className="text-teal-600 hover:text-teal-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-teal-700 font-mono">
                      <span className="text-gray-500 text-xs font-arabic ml-1">الجذر:</span>
                      {activeRootFilter}
                    </span>
                  </div>
                )}
                {activeSurahFilter !== null && (
                  <div className="flex items-center justify-between bg-amber-50 rounded px-2 py-1">
                    <button
                      onClick={() => setActiveSurahFilter(null)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-amber-700 font-arabic">
                      {surahs.find((s) => s.num === activeSurahFilter)?.name}
                    </span>
                  </div>
                )}
                {search.trim() && (
                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <button
                      onClick={() => setSearch('')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-gray-700 font-arabic">{search}</span>
                  </div>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:text-red-700 text-right mt-1 font-arabic"
                >
                  مسح جميع التصفيات
                </button>
              </div>
            )}
          </div>

          {/* User Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowTags((p) => !p)}
            >
              <span>{showTags ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</span>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 font-arabic">
                وسوماتك
              </h2>
            </button>
            {showTags && (
              <div className="mt-3">
                {allUserTags.length === 0 ? (
                  <p className="text-sm text-gray-400 font-arabic">سمِّ آية لبناء تصنيفك.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {allUserTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-arabic"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Roots in corpus */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowRoots((p) => !p)}
            >
              <span>{showRoots ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</span>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 font-arabic">
                الجذور في المتن
              </h2>
            </button>
            {showRoots && (
              <div className="mt-3 flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                {allRoots.map((root) => (
                  <button
                    key={root}
                    onClick={() => handleRootClick(root)}
                    title={ROOT_GLOSS[root] ?? ''}
                    className={`
                      text-xs px-2 py-0.5 rounded-full border font-mono transition-colors
                      ${activeRootFilter === root
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'}
                    `}
                  >
                    {root}
                    <span className="text-teal-400 mr-1 font-sans">·{rootVerseCount[root]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Verse list */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-arabic">
              {filteredVerses.length} آية
            </span>
          </div>

          {filteredVerses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <p className="text-lg mb-2 font-arabic">لا توجد نتائج مطابقة.</p>
              <p className="text-sm font-arabic">
                جرِّب مسح التصفيات أو ابحث بجذر معروف مثل{' '}
                <button
                  className="text-teal-600 hover:underline font-mono"
                  onClick={() => setSearch('ر ح م')}
                >
                  ر ح م
                </button>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredVerses.map((verse) => (
                <VerseCard
                  key={verse.id}
                  verse={verse}
                  isSelected={selectedVerseId === verse.id}
                  tags={storageData.tags[verse.id] ?? []}
                  activeRootFilter={activeRootFilter}
                  onSelect={() => handleVerseSelect(verse.id)}
                  onRootClick={handleRootClick}
                  selectedWord={selectedVerseId === verse.id ? selectedWord : null}
                  onWordClick={(word) => {
                    setSelectedVerseId(verse.id);
                    setSelectedWord(word);
                  }}
                />
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        <aside className="w-80 shrink-0">
          <div className="sticky top-4 bg-white rounded-xl border border-gray-200 min-h-[400px] max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
            <DetailPanel
              verse={selectedVerse}
              tags={selectedVerseId ? (storageData.tags[selectedVerseId] ?? []) : []}
              note={selectedVerseId ? (storageData.notes[selectedVerseId] ?? '') : ''}
              selectedWord={selectedWord}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onNoteChange={handleNoteChange}
              onWordClick={setSelectedWord}
            />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-3 text-center text-xs text-gray-400 font-arabic">
        يعرض متناً تجريبياً — الفاتحة، ومختارات من البقرة، وسورة الإخلاص. للتوسع، اربط واجهة برمجة Quran.com أو مدوّنة القرآن العربي.
      </footer>
    </div>
  );
}
