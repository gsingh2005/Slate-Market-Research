export type ChartTheme = {
  accent: string;
  areaBottom: string;
  areaTop: string;
  background: string;
  bearish: string;
  border: string;
  bullish: string;
  crosshair: string;
  grid: string;
  text: string;
};

const palettes: Record<"dark" | "light", ChartTheme> = {
  dark: {
    accent: "#60A5FA",
    areaBottom: "rgba(96, 165, 250, 0.05)",
    areaTop: "rgba(96, 165, 250, 0.4)",
    background: "#0D131C",
    bearish: "#FB7185",
    border: "#253244",
    bullish: "#2DD4BF",
    crosshair: "#A7B3C4",
    grid: "#253244",
    text: "#A7B3C4",
  },
  light: {
    accent: "#2563EB",
    areaBottom: "rgba(37, 99, 235, 0.04)",
    areaTop: "rgba(37, 99, 235, 0.32)",
    background: "#FFFFFF",
    bearish: "#BE3455",
    border: "#CBD5E1",
    bullish: "#0F766E",
    crosshair: "#64748B",
    grid: "#D9E2ED",
    text: "#43536B",
  },
};

const supportedColor =
  /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/i;
let warned = false;

export function isChartColor(value: unknown): value is string {
  return typeof value === "string" && supportedColor.test(value.trim()) && !value.includes("var(");
}

function validated(option: keyof ChartTheme, value: unknown, fallback: string): string {
  if (isChartColor(value)) return value.trim();
  if (process.env.NODE_ENV !== "production") throw new Error(`Invalid chart color for ${option}.`);
  if (!warned) {
    console.warn(`Invalid chart color for ${option}; using a safe fallback.`);
    warned = true;
  }
  return fallback;
}

export function getChartTheme(theme: string | undefined): ChartTheme {
  const palette = palettes[theme === "light" ? "light" : "dark"];
  return Object.fromEntries(
    Object.entries(palette).map(([option, value]) => [
      option,
      validated(option as keyof ChartTheme, value, "#60A5FA"),
    ]),
  ) as ChartTheme;
}
