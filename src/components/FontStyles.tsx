export function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
      .arabic-word { transition: background-color 0.15s ease, color 0.15s ease; }
      .arabic-word:hover { background-color: var(--bg-muted); }
      .arabic-word.is-root-match { background-color: rgb(var(--accent-rgb) / 0.12); }
      .arabic-word.is-selected { background-color: var(--accent); color: var(--bg); }
    `}</style>
  );
}
