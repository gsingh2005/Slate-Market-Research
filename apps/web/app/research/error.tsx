"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ResearchError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error("Research page failed", error);
  }, [error]);

  return (
    <main className="card p-8">
      <p className="label">Research workspace unavailable</p>
      <h1 className="mt-2 text-3xl font-bold">This research view could not be displayed.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 muted">
        Try loading the view again. If the issue continues, return to the sample universe and choose
        another security.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" className="chart-choice" onClick={reset}>
          Try again
        </button>
        <Link className="chart-choice" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
