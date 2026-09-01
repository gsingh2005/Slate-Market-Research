"use client";
import { useState } from "react";
import { api, type Research } from "../../lib/api";
const defaults = ["AAPL", "MSFT", "NVDA"];
export default function Compare() {
  const [symbols, setSymbols] = useState(defaults.join(", "));
  const [items, setItems] = useState<Research[]>([]);
  const [error, setError] = useState("");
  async function compare() {
    try {
      setError("");
      setItems(
        await Promise.all(
          symbols
            .split(",")
            .map((symbol) => api<Research>(`/research/${symbol.trim().toUpperCase()}`)),
        ),
      );
    } catch {
      setError("Use covered symbols such as AAPL, MSFT, NVDA, AMZN, GOOGL, JPM, XOM, or SPY.");
    }
  }
  return (
    <main>
      <p className="label">Side by side</p>
      <h1 className="font-['Instrument_Serif'] text-6xl tracking-[-.05em]">Compare conviction</h1>
      <div className="mt-6 flex max-w-xl overflow-hidden rounded-xl border border-[#c7cbbd] bg-white">
        <input
          value={symbols}
          onChange={(event) => setSymbols(event.target.value)}
          className="min-w-0 flex-1 px-4 py-3 outline-none"
        />
        <button
          type="button"
          onClick={compare}
          className="bg-[#16231f] px-5 text-sm font-bold text-white"
        >
          Compare
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-[#c34b32]">{error}</p>}
      {items.length === 0 ? (
        <p className="mt-10 text-sm text-[#6e7d75]">
          Enter two or more comma-separated symbols, then run the comparison.
        </p>
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article className="card p-5" key={item.profile.symbol}>
              <p className="mono font-bold text-[#1f6b4f]">{item.profile.symbol}</p>
              <h2 className="mt-1 text-lg font-extrabold">{item.profile.name}</h2>
              <p className="mt-5 label">Momentum</p>
              <p className="metric text-3xl">{String(item.scores.momentum_score)}</p>
              <p className="mt-4 text-sm text-[#6e7d75]">
                3M return{" "}
                <span className="mono text-[#16231f]">
                  {((item.metrics.return_3m || 0) * 100).toFixed(1)}%
                </span>
              </p>
              <p className="mt-2 text-sm text-[#6e7d75]">
                P/E{" "}
                <span className="mono text-[#16231f]">{String(item.fundamentals.pe_ratio)}</span>
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
