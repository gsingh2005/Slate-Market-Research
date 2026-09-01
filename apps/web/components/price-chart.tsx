"use client";
import { useEffect, useRef } from "react";
import { ColorType, createChart } from "lightweight-charts";
export function PriceChart({
  bars,
  sma,
}: { bars: { date: string; close: number }[]; sma: (number | null)[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height: 360,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#6e7d75" },
      grid: { vertLines: { color: "#e5e6dd" }, horzLines: { color: "#e5e6dd" } },
      rightPriceScale: { borderColor: "#d7d9ce" },
      timeScale: { borderColor: "#d7d9ce" },
    });
    const line = chart.addLineSeries({ color: "#1f6b4f", lineWidth: 2 });
    line.setData(bars.map((bar) => ({ time: bar.date, value: bar.close })));
    const average = chart.addLineSeries({ color: "#e86d38", lineWidth: 1, lineStyle: 2 });
    average.setData(
      bars.flatMap((bar, index) => {
        const value = sma[index];
        return value === null ? [] : [{ time: bar.date, value }];
      }),
    );
    chart.timeScale().fitContent();
    const resize = new ResizeObserver(() =>
      chart.applyOptions({ width: ref.current?.clientWidth || 0 }),
    );
    resize.observe(ref.current);
    return () => {
      resize.disconnect();
      chart.remove();
    };
  }, [bars, sma]);
  return <div ref={ref} className="w-full" />;
}
