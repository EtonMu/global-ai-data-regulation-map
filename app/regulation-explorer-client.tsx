"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, RotateCw } from "lucide-react";

type DynamicLoadingProps = {
  error?: Error | null;
  retry?: () => void;
};

function reloadAtlas() {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#view=atlas`,
  );
  window.location.reload();
}

function ExplorerLoadingShell({ error, retry }: DynamicLoadingProps) {
  if (error) {
    return (
      <main className="explorer-loading-shell" role="alert">
        <p className="terminal-label">EXPLORER_LOAD_INTERRUPTED</p>
        <h1>The regulatory atlas did not finish loading.</h1>
        <p>{error.message}</p>
        <div>
          <button type="button" className="interface-back-button" onClick={retry}>
            <RotateCw aria-hidden="true" />
            RETRY
          </button>
          <button
            type="button"
            className="interface-back-button"
            onClick={reloadAtlas}
          >
            <ArrowLeft aria-hidden="true" />
            RETURN TO ATLAS
          </button>
        </div>
      </main>
    );
  }
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
