"use client";

import { useEffect, useState } from "react";

import { apiConfiguration, apiStatus } from "../lib/api";

type Health = { status: string; mode: string; provider: string };

export function ProviderDiagnostics() {
  const [health, setHealth] = useState<Health | null>(null);
  const [ready, setReady] = useState("checking");
  useEffect(() => {
    apiStatus<Health>("health")
      .then(setHealth)
      .catch(() => setReady("unavailable"));
    apiStatus<{ status: string }>("ready")
      .then((result) => setReady(result.status))
      .catch(() => setReady("unavailable"));
  }, []);
  return (
    <section className="card p-5 text-sm">
      <p className="label">Provider status</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="muted">API origin</dt>
          <dd className="mono mt-1 break-all">{apiConfiguration.origin}</dd>
        </div>
        <div>
          <dt className="muted">Backend</dt>
          <dd className="mt-1">{health?.status || "unavailable"}</dd>
        </div>
        <div>
          <dt className="muted">Readiness</dt>
          <dd className="mt-1">{ready}</dd>
        </div>
        <div>
          <dt className="muted">Data mode</dt>
          <dd className="mt-1">{health ? `${health.mode} / ${health.provider}` : "unavailable"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs muted">
        Sample mode is explicitly labeled. Observation timestamps are included in each research
        result.
      </p>
    </section>
  );
}
