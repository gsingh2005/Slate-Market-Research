"use client";

import { ColorType, createChart } from "lightweight-charts";
import { useEffect, useState } from "react";

type Bar = { date: string; open: number; high: number; low: number; close: number; volume: number };

function colors() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent: style.getPropertyValue("--accent").trim(),
    grid: style.getPropertyValue("--chart-grid").trim(),
    muted: style.getPropertyValue("--muted").trim(),
    negative: style.getPropertyValue("--negative").trim(),
    positive: style.getPropertyValue("--positive").trim(),
    surface: style.getPropertyValue("--surface").trim(),
    text: style.getPropertyValue("--text-secondary").trim(),
  };
}

export function normalizedBars(bars: Bar[]) {
  const byDate = new Map<string, Bar>();
  for (const bar of bars) {
    if (
      [bar.open, bar.high, bar.low, bar.close].every(Number.isFinite) &&
      /^\d{4}-\d{2}-\d{2}$/.test(bar.date)
    )
      byDate.set(bar.date, bar);
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function PriceChart({ bars, sma }: { bars: Bar[]; sma: (number | null)[] }) {
  const [theme, setTheme] = useState("dark");
  const validBars = normalizedBars(bars);
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme || "dark");
    update();
    window.addEventListener("slate-theme-change", update);
    return () => window.removeEventListener("slate-theme-change", update);
  }, []);
  useEffect(() => {
    const normalized = normalizedBars(bars);
    const container = document.getElementById("primary-price-chart");
    if (!container || normalized.length === 0 || !theme) return;
    const token = colors();
    const chart = createChart(container, {
      height: 380,
      width: container.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: token.surface },
        textColor: token.text,
      },
      grid: { vertLines: { color: token.grid }, horzLines: { color: token.grid } },
      crosshair: { vertLine: { color: token.muted }, horzLine: { color: token.muted } },
      rightPriceScale: { borderColor: token.grid },
      timeScale: { borderColor: token.grid },
    });
    const candles = chart.addCandlestickSeries({
      upColor: token.positive,
      downColor: token.negative,
      borderVisible: false,
      wickUpColor: token.positive,
      wickDownColor: token.negative,
    });
    candles.setData(
      normalized.map((bar) => ({
        time: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    );
    const average = chart.addLineSeries({ color: token.accent, lineWidth: 2, lineStyle: 2 });
    average.setData(
      normalized.flatMap((bar) => {
        const index = bars.findIndex((item) => item.date === bar.date);
        const value = sma[index];
        return typeof value === "number" && Number.isFinite(value)
          ? [{ time: bar.date, value }]
          : [];
      }),
    );
    chart.timeScale().fitContent();
    const resize = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }));
    resize.observe(container);
    return () => {
      resize.disconnect();
      chart.remove();
    };
  }, [bars, sma, theme]);
  if (validBars.length === 0)
    return (
      <div className="chart-empty">No valid OHLC observations are available for this symbol.</div>
    );
  return (
    <div
      id="primary-price-chart"
      className="w-full min-h-[380px]"
      aria-label="Candlestick price chart"
    />
  );
}
