import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../lib/constants";
import { loadJSON, saveJSON } from "../../lib/storage";

const STORAGE_UNAVAILABLE = "التخزين غير متاح؛ ستبقى الوسوم والملاحظات فقط طوال هذه الجلسة.";

export function useUserTagsAndNotes() {
  const [userTags, setUserTags] = useState<Record<string, string[]>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

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
        setStorageError(STORAGE_UNAVAILABLE);
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  useEffect(() => { if (storageReady) saveJSON(STORAGE_KEYS.tags, userTags); }, [userTags, storageReady]);
  useEffect(() => { if (storageReady) saveJSON(STORAGE_KEYS.notes, userNotes); }, [userNotes, storageReady]);

  const addTag = useCallback((verseId: string, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setUserTags(p => {
      const c = p[verseId] || [];
      if (c.includes(t)) return p;
      return { ...p, [verseId]: [...c, t] };
    });
  }, []);

  const removeTag = useCallback((verseId: string, tag: string) => {
    setUserTags(p => {
      const c = (p[verseId] || []).filter(x => x !== tag);
      const n = { ...p };
      if (c.length) n[verseId] = c; else delete n[verseId];
      return n;
    });
  }, []);

  const setNote = useCallback((verseId: string, note: string) => {
    setUserNotes(p => {
      const n = { ...p };
      if (note.trim()) n[verseId] = note; else delete n[verseId];
      return n;
    });
  }, []);

  const tagsByFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(userTags).forEach(arr => arr.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [userTags]);

  return { userTags, userNotes, storageError, addTag, removeTag, setNote, tagsByFrequency };
}
