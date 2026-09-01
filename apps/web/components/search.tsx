"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
export function SymbolSearch() {
  const [symbol, setSymbol] = useState("AAPL");
  const router = useRouter();
  function submit(event: FormEvent) {
    event.preventDefault();
    router.push(`/research/?symbol=${encodeURIComponent(symbol.toUpperCase().trim())}`);
  }
  return (
    <form
      onSubmit={submit}
      className="theme-surface flex w-full max-w-md overflow-hidden rounded-xl border"
    >
      <input
        aria-label="Ticker symbol"
        value={symbol}
        onChange={(event) => setSymbol(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold uppercase outline-none"
      />
      <button
        type="submit"
        className="bg-[var(--accent)] px-4 text-sm font-bold text-[var(--page)] hover:bg-[var(--accent-hover)]"
      >
        Research
      </button>
    </form>
  );
}
