import Link from "next/link";
import { SymbolSearch } from "../components/search";
const ideas = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "JPM", "XOM", "SPY"];
export default function Home() {
  return (
    <main>
      <section className="grid gap-10 md:grid-cols-[1.25fr_.75fr]">
        <div className="py-7">
          <p className="label mb-4">Independent research terminal</p>
          <h1 className="max-w-3xl font-['Instrument_Serif'] text-6xl leading-[.9] tracking-[-.055em] md:text-8xl">
            Find signal.
            <br />
            <i>Keep context.</i>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#6e7d75]">
            A deliberate workspace for technical structure, fundamental checks, and evidence-aware
            decision notes. It works locally with deterministic data from the first launch.
          </p>
          <div className="mt-8">
            <SymbolSearch />
          </div>
        </div>
        <aside className="card relative overflow-hidden p-7">
          <div className="absolute right-[-30px] top-[-35px] h-40 w-40 rounded-full bg-[#dbe8c8]" />
          <p className="label relative">Today in Slate</p>
          <p className="relative mt-7 font-['Instrument_Serif'] text-4xl leading-none">
            Your research should explain its uncertainty.
          </p>
          <p className="relative mt-6 text-sm leading-6 text-[#6e7d75]">
            Price history, scoring, and backtests label their source and limitations instead of
            implying certainty.
          </p>
        </aside>
      </section>
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="label">Sample universe</p>
            <h2 className="font-['Instrument_Serif'] text-4xl">Start with a name</h2>
          </div>
          <Link href="/screener" className="text-sm font-bold text-[#1f6b4f]">
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
              <p className="mt-2 text-xs text-[#6e7d75]">Research view</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
