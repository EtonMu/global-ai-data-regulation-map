"use client";

import dynamic from "next/dynamic";

function ExplorerLoadingShell() {
  return (
    <main className="explorer-loading-shell" aria-busy="true" aria-live="polite">
      <div className="explorer-loading-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="terminal-label">COMPLIANCE_COMPASS</p>
      <h1>Loading the global regulatory atlas</h1>
      <p role="status">Preparing legal corpora and knowledge relationships…</p>
    </main>
  );
}

const RegulationExplorer = dynamic(() => import("./regulation-explorer"), {
  ssr: false,
  loading: ExplorerLoadingShell,
});

export default function RegulationExplorerClient() {
  return <RegulationExplorer />;
}
