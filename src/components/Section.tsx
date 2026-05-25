import type { ReactNode } from "react";

interface Props {
  title: string;
  icon: ReactNode;
  count?: number;
  children: ReactNode;
}

export function Section({ title, icon, count, children }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-4)" }}>{icon}</span>
        <h2
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-2)", fontWeight: 600, letterSpacing: "0.1em" }}
          dir="rtl"
        >
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="ml-auto text-xs" style={{ color: "var(--text-5)" }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
