import "./globals.css";
import Link from "next/link";

import { ThemeToggle } from "../components/theme-toggle";

export const metadata = {
  title: "Slate Market Research",
  description: "Offline-first equity research terminal",
};
export const viewport = { themeColor: "#101923" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('slate-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';document.documentElement.style.colorScheme=document.documentElement.dataset.theme}catch(e){}",
          }}
        />
      </head>
      <body>
        <div className="shell">
          <header className="app-header mb-8 flex flex-wrap items-center justify-between gap-4 pb-4">
            <Link href="/" className="brand">
              Slate<span className="text-[#1f6b4f]">.</span>
            </Link>
            <nav className="flex gap-4 text-sm font-bold" aria-label="Main navigation">
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
            <div className="flex items-center gap-3">
              <div className="status-badge mono">SAMPLE DATA</div>
              <ThemeToggle />
            </div>
          </header>
          {children}
          <footer className="app-footer mt-14 py-7 text-xs leading-5">
            Slate is research software, not investment advice. Verify all figures against primary
            sources before making decisions.
          </footer>
        </div>
      </body>
    </html>
  );
}
