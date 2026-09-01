const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${base}/api/v1${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
export type Research = {
  profile: {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    market_cap: number;
    description: string;
    provider: string;
  };
  bars: { date: string; open: number; high: number; low: number; close: number; volume: number }[];
  metrics: Record<string, number>;
  indicators: Record<string, (number | null)[]>;
  fundamentals: Record<string, number | string>;
  scores: Record<string, number | string>;
  risks: string[];
  data_notes: string[];
};
