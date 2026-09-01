"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { type ApiError, api, type Research } from "../lib/api";
import { PriceChart } from "./price-chart";
import { StatisticHelp } from "./statistic-help";

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
        <p className="mt-2 text-sm muted">Requesting current provider data for {symbol}.</p>
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
          <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 text-4xl font-extrabold tracking-[-.05em] md:text-6xl">
            <span className="mono">{data.profile.symbol}</span>
            <span className="text-xl font-semibold tracking-normal muted md:text-3xl">
              {data.profile.name}
            </span>
          </h1>
        </div>
        <Link
          href="/compare"
          className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent)]"
        >
          Compare stocks
        </Link>
      </div>
      <div className="metric-strip mt-7 grid grid-cols-2 md:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div key={label}>
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
              <h2 className="text-2xl font-bold tracking-tight">Price structure</h2>
            </div>
            <p className="mono text-[10px] text-[var(--accent)]">SMA 50 overlay</p>
          </div>
          <PriceChart bars={data.bars} sma={data.indicators.sma_50} />
        </div>
        <aside className="card p-6">
          <p className="label">Analysis summary</p>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm muted">
                Momentum score{" "}
                <StatisticHelp label="Momentum score">
                  A transparent 0-100 blend of three-month return and price versus its 50-day
                  average. It describes recent behavior; it is not a recommendation.
                </StatisticHelp>
              </p>
              <p className="metric text-4xl">
                {format(Number(data.scores.momentum_score))}
                <span className="text-base muted"> / 100</span>
              </p>
            </div>
            <div>
              <p className="text-sm muted">
                Potential local-bottom setup{" "}
                <StatisticHelp label="Potential local-bottom setup">
                  A bounded rule-based setup using RSI and recent return. It is not a trained
                  probability or a forecast.
                </StatisticHelp>
              </p>
              <p className="metric text-4xl">
                {format(Number(data.scores.potential_bottom_probability))}
                <span className="text-base muted">%</span>
              </p>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <p className="label">Market condition</p>
              <p className="mt-1 text-lg font-extrabold text-[var(--positive)]">
                {String(data.scores.market_condition)}
              </p>
              <p className="mt-1 text-sm muted">RSI: {String(data.scores.rsi_signal)}</p>
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
                  <p className="muted">{key.replaceAll("_", " ")}</p>
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
          <ul className="mt-4 space-y-3 text-sm leading-6 muted">
            {data.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
          <div className="mt-5 border-t border-[var(--border)] pt-4 mono text-[10px] muted">
            {data.data_notes.join(" · ")}
          </div>
        </div>
      </section>
      <details className="card mt-7 p-6">
        <summary className="cursor-pointer text-lg font-bold">
          Advanced statistics and methodology
        </summary>
        <p className="mt-2 max-w-3xl text-sm muted">
          Calculated from daily adjusted-close returns over the available sample history using 252
          trading days per year and SPY as the benchmark. Values are descriptive and can be unstable
          with limited or synthetic history.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Statistic
            label="Annualized return"
            value={percent(data.metrics.annualized_return)}
            help="Compounded return annualized from the available sample period. Higher historical return does not imply future return."
          />
          <Statistic
            label="Annualized volatility"
            value={percent(data.metrics.annualized_volatility)}
            help="Typical annualized price variability from daily returns. Higher values generally mean more variability and risk."
          />
          <Statistic
            label="Sharpe ratio"
            value={format(data.metrics.sharpe_ratio, 2)}
            help="Annualized average return divided by total return variability, with a zero cash-rate assumption."
          />
          <Statistic
            label="Sortino ratio"
            value={format(data.metrics.sortino_ratio, 2)}
            help="Like Sharpe, but focuses on downside variation. It can be unreliable with few negative observations."
          />
          <Statistic
            label="Alpha vs SPY"
            value={percent(data.metrics.alpha_vs_spy)}
            help="Historical annualized return unexplained by this sample's beta versus SPY. It is not skill or a forecast."
          />
          <Statistic
            label="Correlation vs SPY"
            value={format(data.metrics.correlation_vs_spy, 2)}
            help="How closely daily returns moved with SPY, from -1 to +1."
          />
          <Statistic
            label="Value at Risk (95%)"
            value={percent(data.metrics.value_at_risk_95)}
            help="The fifth percentile daily historical return. It describes sample loss frequency, not a maximum loss."
          />
          <Statistic
            label="Expected shortfall (95%)"
            value={percent(data.metrics.conditional_value_at_risk_95)}
            help="Average daily return among outcomes at or below historical Value at Risk."
          />
          <Statistic
            label="Current drawdown"
            value={percent(data.metrics.current_drawdown)}
            help="Current decline from the highest observed price in the available sample."
          />
          <Statistic
            label="Positive days"
            value={percent(data.metrics.positive_day_percentage)}
            help="Share of daily returns above zero in the sample period."
          />
        </div>
      </details>
      <section className="mt-7 grid gap-7 lg:grid-cols-2">
        <article className="card p-6">
          <p className="label">Directional evidence</p>
          <h2 className="mt-2 text-2xl font-bold">
            {String(data.scores.directional_evidence_label)}{" "}
            <span className="mono text-[var(--accent)]">
              {format(Number(data.scores.directional_evidence))}
            </span>
          </h2>
          <p className="mt-2 text-sm muted">
            Transparent evidence from trend, momentum, and RSI. It is descriptive, not a buy or sell
            meter.
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="muted">Trend</dt>
              <dd className="mono">{String(data.scores.trend_contribution)}</dd>
            </div>
            <div>
              <dt className="muted">Momentum</dt>
              <dd className="mono">{String(data.scores.momentum_contribution)}</dd>
            </div>
            <div>
              <dt className="muted">RSI</dt>
              <dd className="mono">{String(data.scores.rsi_contribution)}</dd>
            </div>
          </dl>
        </article>
        <article className="card p-6">
          <p className="label">Possible outcomes</p>
          <h2 className="mt-2 text-2xl font-bold">
            10-session historical scenarios{" "}
            <StatisticHelp label="Historical scenarios">
              Overlapping ten-session returns from this sample history. The 10th, 50th, and 90th
              percentiles summarize historical variability; they are not forecasts or price targets.
            </StatisticHelp>
          </h2>
          <Scenario scenario={data.scores.scenario_10} last={data.metrics.last_price} />
        </article>
      </section>
    </main>
  );
}

function Unavailable({ symbol, message }: { symbol: string; message: string }) {
  return (
    <main className="card p-8">
      <p className="label">Research unavailable</p>
      <h1 className="mt-2 mono text-5xl">{symbol}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 muted">
        {message} Slate does not substitute demo values when a configured API cannot be reached.
      </p>
      <Link href="/providers" className="mt-6 inline-block text-sm font-bold text-[var(--accent)]">
        Review data provider status
      </Link>
    </main>
  );
}

function Scenario({
  scenario,
  last,
}: { scenario: Research["scores"][string]; last: number | undefined }) {
  if (!scenario || typeof scenario !== "object" || !last)
    return <p className="mt-4 text-sm muted">Insufficient history for scenarios.</p>;
  const values = scenario as Record<string, number | string | null>;
  return (
    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
      {[
        ["Downside", "downside_return"],
        ["Middle", "median_return"],
        ["Upside", "upside_return"],
      ].map(([label, key]) => {
        const value = Number(values[key]);
        return (
          <div key={label}>
            <p className="muted">Historical {label.toLowerCase()}</p>
            <p className="mono mt-1">{percent(value)}</p>
            <p className="text-xs muted">${format(last * (1 + value), 2)}</p>
          </div>
        );
      })}
    </div>
  );
}

function Statistic({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div>
      <p className="label">
        {label} <StatisticHelp label={label}>{help}</StatisticHelp>
      </p>
      <p className="metric mt-2">{value}</p>
    </div>
  );
}
