"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { type ApiError, api, type Research } from "../lib/api";
import { PriceChart } from "./price-chart";

const format = (value?: number, digits = 1) =>
  value === undefined
    ? "-"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
const percent = (value?: number) =>
  value === undefined ? "-" : `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;

export function ResearchView() {
  const searchParams = useSearchParams();
  const symbol = (searchParams.get("symbol") || "AAPL").trim().toUpperCase();
  const [data, setData] = useState<Research | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api<Research>(`research/${encodeURIComponent(symbol)}`)
      .then(setData)
      .catch(setError);
  }, [symbol]);

  if (error) {
    return <Unavailable symbol={symbol} message={error.message} />;
  }
  if (!data) {
    return (
      <main className="card p-8">
        <p className="label">Loading research</p>
        <p className="mt-2 text-sm text-[#6e7d75]">
          Requesting current provider data for {symbol}.
        </p>
      </main>
    );
  }

  const metrics = [
    ["Last", `$${format(data.metrics.last_price, 2)}`],
    ["1 month", percent(data.metrics.return_1m)],
    ["3 months", percent(data.metrics.return_3m)],
    ["Volatility", percent(data.metrics.annualized_volatility)],
    ["Beta / SPY", format(data.metrics.beta_vs_spy, 2)],
    ["Max drawdown", percent(data.metrics.max_drawdown)],
  ];
  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">
            {data.profile.sector} / {data.profile.industry}
          </p>
          <h1 className="mt-1 font-['Instrument_Serif'] text-6xl tracking-[-.05em]">
            {data.profile.symbol} <span className="text-[#6e7d75]">{data.profile.name}</span>
          </h1>
        </div>
        <Link
          href="/compare"
          className="rounded-full border border-[#1f6b4f] px-4 py-2 text-sm font-bold text-[#1f6b4f]"
        >
          Compare names
        </Link>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#d7d9ce] bg-[#d7d9ce] md:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div className="bg-[#fbfaf5] p-4" key={label}>
            <p className="label">{label}</p>
            <p className="metric mt-2">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-7 grid gap-7 xl:grid-cols-[1.6fr_.65fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="label">Adjusted close</p>
              <h2 className="font-['Instrument_Serif'] text-3xl">Price structure</h2>
            </div>
            <p className="mono text-[10px] text-[#e86d38]">ORANGE: SMA 50</p>
          </div>
          <PriceChart bars={data.bars} sma={data.indicators.sma_50} />
        </div>
        <aside className="card p-6">
          <p className="label">Signal board</p>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm text-[#6e7d75]">Momentum score</p>
              <p className="metric text-4xl">
                {format(Number(data.scores.momentum_score))}
                <span className="text-base text-[#6e7d75]"> / 100</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6e7d75]">Potential bottom probability</p>
              <p className="metric text-4xl">
                {format(Number(data.scores.potential_bottom_probability))}
                <span className="text-base text-[#6e7d75]">%</span>
              </p>
            </div>
            <div className="border-t border-[#d7d9ce] pt-4">
              <p className="label">Regime</p>
              <p className="mt-1 text-lg font-extrabold text-[#1f6b4f]">
                {String(data.scores.regime)}
              </p>
              <p className="mt-1 text-sm text-[#6e7d75]">RSI: {String(data.scores.rsi_signal)}</p>
            </div>
          </div>
        </aside>
      </section>
      <section className="mt-7 grid gap-7 lg:grid-cols-2">
        <div className="card p-6">
          <p className="label">Fundamental snapshot</p>
          <div className="mt-4 grid grid-cols-2 gap-y-5 text-sm">
            {Object.entries(data.fundamentals)
              .filter(([, value]) => typeof value === "number")
              .map(([key, value]) => (
                <div key={key}>
                  <p className="text-[#6e7d75]">{key.replaceAll("_", " ")}</p>
                  <p className="mono mt-1">
                    {key.includes("margin") || key.includes("growth")
                      ? percent(value as number)
                      : format(value as number, 2)}
                  </p>
                </div>
              ))}
          </div>
        </div>
        <div className="card p-6">
          <p className="label">Research guardrails</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6e7d75]">
            {data.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
          <div className="mt-5 border-t border-[#d7d9ce] pt-4 mono text-[10px] text-[#6e7d75]">
            {data.data_notes.join(" · ")}
          </div>
        </div>
      </section>
    </main>
  );
}

function Unavailable({ symbol, message }: { symbol: string; message: string }) {
  return (
    <main className="card p-8">
      <p className="label">Research unavailable</p>
      <h1 className="mt-2 font-['Instrument_Serif'] text-5xl">{symbol}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#6e7d75]">
        {message} Slate does not substitute demo values when a configured API cannot be reached.
      </p>
      <Link href="/providers" className="mt-6 inline-block text-sm font-bold text-[#1f6b4f]">
        Review data provider status
      </Link>
    </main>
  );
}
