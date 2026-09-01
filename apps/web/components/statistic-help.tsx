"use client";

import { useEffect, useRef, useState } from "react";

export function StatisticHelp({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setOpen(false);
      if (event instanceof MouseEvent && !root.current?.contains(event.target as Node))
        setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("mousedown", close);
    };
  }, []);
  return (
    <span
      className="help"
      ref={root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`Explain ${label}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" className="help-panel">
          <strong>{label}</strong>
          <br />
          {children}
        </span>
      )}
    </span>
  );
}
