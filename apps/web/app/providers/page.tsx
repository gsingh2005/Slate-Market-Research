import { ProviderDiagnostics } from "../../components/provider-diagnostics";

export default function Providers() {
  return (
    <main>
      <p className="label">Data integrity</p>
      <h1 className="font-['Instrument_Serif'] text-6xl tracking-[-.05em]">Provider posture</h1>
      <div className="mt-6">
        <ProviderDiagnostics />
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {[
          [
            "Current mode",
            "Deterministic sample",
            "The application is immediately usable offline. Dates, OHLCV, and fundamentals are generated reproducibly for product demos and automated tests.",
          ],
          [
            "EOD price adapter",
            "Stooq",
            "A provider boundary is included for end-of-day market history. Configure a network client and document its licensing before production use.",
          ],
          [
            "Fundamentals adapter",
            "SEC EDGAR",
            "Use company facts with a mapped CIK, rate limiting, and a descriptive User-Agent. Primary filings remain the source of truth.",
          ],
          [
            "Macro adapter",
            "FRED",
            "Optional macro series support belongs behind its own API key and source metadata.",
          ],
        ].map(([label, title, body]) => (
          <article className="card p-6" key={title}>
            <p className="label">{label}</p>
            <h2 className="mt-2 font-['Instrument_Serif'] text-3xl">{title}</h2>
            <p className="mt-3 text-sm leading-6 muted">{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
