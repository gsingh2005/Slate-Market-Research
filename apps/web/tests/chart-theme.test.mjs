import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all chart palette options are concrete, validated colors", async () => {
  const source = await readFile(new URL("../lib/chart-theme.ts", import.meta.url), "utf8");
  const chart = await readFile(new URL("../components/price-chart.tsx", import.meta.url), "utf8");
  for (const option of [
    "accent",
    "areaBottom",
    "areaTop",
    "background",
    "bearish",
    "border",
    "bullish",
    "crosshair",
    "grid",
    "text",
  ]) {
    assert.match(source, new RegExp(`${option}:`));
  }
  assert.match(source, /function isChartColor/);
  assert.match(source, /Invalid chart color for/);
  assert.doesNotMatch(source, /getComputedStyle|--text-secondary/);
  assert.match(chart, /topColor: token\.areaTop/);
  assert.match(chart, /bottomColor: token\.areaBottom/);
});
