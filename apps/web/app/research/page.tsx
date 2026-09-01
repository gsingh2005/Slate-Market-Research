import { Suspense } from "react";

import { ResearchView } from "../../components/research-view";

export default function ResearchPage() {
  return (
    <Suspense fallback={<main className="card p-8">Loading research workspace.</main>}>
      <ResearchView />
    </Suspense>
  );
}
