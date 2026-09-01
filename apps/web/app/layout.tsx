import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Slate Market Research",
  description: "Offline-first equity research terminal",
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="shell">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-5 border-b border-[#d7d9ce] pb-5">
        <Link href="/" className="brand">
          Slate<span className="text-[#1f6b4f]">.</span>
        </Link>
        <nav className="flex gap-5 text-sm font-bold">
          <Link className="nav-link" href="/">
            Research
          </Link>
          <Link className="nav-link" href="/screener">
            Screener
          </Link>
          <Link className="nav-link" href="/compare">
            Compare
          </Link>
          <Link className="nav-link" href="/providers">
            Data
          </Link>
        </nav>
        <div className="mono rounded-full bg-[#1f6b4f] px-3 py-1 text-[10px] text-white">
          OFFLINE-READY
        </div>
      </header>
      {children}
      <footer className="mt-14 border-t border-[#d7d9ce] py-7 text-xs leading-5 text-[#6e7d75]">
        Slate is research software, not investment advice. Verify all figures against primary
        sources before making decisions.
      </footer>
    </div>
  );
}
