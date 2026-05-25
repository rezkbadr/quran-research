import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import type { NavSnapshot } from "../search/useNavigationHistory";

interface Props {
  backStack: NavSnapshot[];
  fwdStack: NavSnapshot[];
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onJumpBack: (index: number) => void;
  onJumpForward: (index: number) => void;
}

function snapshotLabel(snap: NavSnapshot): string {
  if (snap.activeRoot && snap.verseId) return `${snap.activeRoot} · ${snap.verseId}`;
  if (snap.activeRoot) return `${snap.activeRoot}`;
  if (snap.verseId) return snap.verseId;
  return `سورة ${snap.surahId}`;
}

function snapshotKind(snap: NavSnapshot): "root" | "verse" | "sura" {
  if (snap.activeRoot) return "root";
  if (snap.verseId) return "verse";
  return "sura";
}

const ARROW_STYLE: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--bg)",
  boxShadow: "0 4px 14px rgb(var(--accent-rgb) / 0.35)",
};

const ARROW_DISABLED_STYLE: React.CSSProperties = {
  background: "var(--bg-elev)",
  color: "var(--text-5)",
  border: "1px solid var(--border)",
  boxShadow: "none",
  cursor: "default",
};

export function NavigationPanel({
  backStack, fwdStack, canBack, canForward, onBack, onForward, onJumpBack, onJumpForward,
}: Props) {
  const hasHistory = backStack.length > 0 || fwdStack.length > 0;
  if (!hasHistory) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-30 flex flex-col items-stretch gap-2"
      style={{ width: 220, maxHeight: "calc(100vh - 48px)" }}
    >
      <div
        className="rounded-sm py-2 overflow-y-auto custom-scroll"
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--border)",
          maxHeight: "60vh",
        }}
        dir="rtl"
      >
        {backStack.map((snap, i) => (
          <NavQueueEntry
            key={`b-${i}`}
            label={snapshotLabel(snap)}
            kind={snapshotKind(snap)}
            onClick={() => onJumpBack(i)}
          />
        ))}
        <div
          className="mx-2 my-1 px-2 py-1.5 rounded-sm flex items-center gap-2 text-xs"
          style={{ background: "rgb(var(--accent-rgb) / 0.12)", color: "var(--accent)" }}
        >
          <MapPin size={11} strokeWidth={2} />
          <span style={{ fontWeight: 600 }}>الموقع الحالي</span>
        </div>
        {fwdStack.map((snap, i) => (
          <NavQueueEntry
            key={`f-${i}`}
            label={snapshotLabel(snap)}
            kind={snapshotKind(snap)}
            onClick={() => onJumpForward(i)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onBack}
          disabled={!canBack}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
          style={canBack ? ARROW_STYLE : ARROW_DISABLED_STYLE}
          aria-label="رجوع"
          title="رجوع"
        >
          <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button
          onClick={onForward}
          disabled={!canForward}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
          style={canForward ? ARROW_STYLE : ARROW_DISABLED_STYLE}
          aria-label="تقدم"
          title="تقدم"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function NavQueueEntry({ label, kind, onClick }: { label: string; kind: "root" | "verse" | "sura"; onClick: () => void }) {
  const useArabicFont = kind === "root" || kind === "sura";
  return (
    <button
      onClick={onClick}
      className="w-full text-right px-3 py-1.5 text-xs transition-colors"
      style={{ color: "var(--text-2)", background: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      dir="rtl"
      title={label}
    >
      <span
        className="block truncate"
        style={useArabicFont ? { fontFamily: "'Amiri', serif", fontSize: 14 } : undefined}
      >
        {label}
      </span>
    </button>
  );
}
