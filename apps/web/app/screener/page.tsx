import Link from "next/link";
import { api } from "../../lib/api";
type Row = {
  symbol: string;
  name: string;
  sector: string;
  last_price: number;
  return_3m: number;
  volatility: number;
  momentum_score: number;
  rsi: number;
};
export default async function Screener() {
  let rows: Row[] = [];
  try {
    rows = await api<Row[]>("/screener");
  } catch {}
  return (
    <main>
      <p className="label">Systematic discovery</p>
      <h1 className="font-['Instrument_Serif'] text-6xl tracking-[-.05em]">Screener</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e7d75]">
        A transparent ranking across the built-in coverage universe. Scores are calculated from the
        same indicators shown in each research view.
      </p>
      <div className="card mt-7 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#d7d9ce] text-[10px] uppercase tracking-[.12em] text-[#6e7d75]">
            <tr>
              <th className="p-4">Symbol</th>
              <th>Company</th>
              <th>Sector</th>
              <th>Last</th>
              <th>3M return</th>
              <th>Volatility</th>
              <th>RSI</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[#e6e6df] last:border-0" key={row.symbol}>
                <td className="p-4 mono font-bold text-[#1f6b4f]">
                  <Link href={`/research/${row.symbol}`}>{row.symbol}</Link>
                </td>
                <td>{row.name}</td>
                <td className="text-[#6e7d75]">{row.sector}</td>
                <td>${row.last_price.toFixed(2)}</td>
                <td className={row.return_3m >= 0 ? "text-[#1f6b4f]" : "text-[#c34b32]"}>
                  {(row.return_3m * 100).toFixed(1)}%
                </td>
                <td>{(row.volatility * 100).toFixed(1)}%</td>
                <td>{row.rsi.toFixed(0)}</td>
                <td className="mono font-bold">{row.momentum_score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
