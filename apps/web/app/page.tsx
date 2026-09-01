import Link from "next/link";
import { SymbolSearch } from "../components/search";
const ideas = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "JPM", "XOM", "SPY"];
export default function Home() {
  return (
    <main>
      <section className="py-5 md:py-10">
        <p className="label mb-4">Independent research workspace</p>
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-[-.055em] md:text-7xl">
          Clear market research, with context.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 muted">
          Explore deterministic sample histories, price behavior, and plain-language risk context.
          This is research software, not live market data or investment advice.
        </p>
        <div className="mt-8">
          <SymbolSearch />
        </div>
      </section>
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="label">Sample universe</p>
            <h2 className="text-3xl font-bold tracking-tight">Start with a sample security</h2>
          </div>
          <Link href="/screener" className="text-sm font-bold text-[var(--accent)]">
            Open screener
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ideas.map((symbol) => (
            <Link
              href={`/research/?symbol=${symbol}`}
              key={symbol}
              className="card p-4 transition hover:-translate-y-1"
            >
              <p className="mono text-lg">{symbol}</p>
              <p className="mt-2 text-xs muted">Research view</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
