"use client";

import { ArrowLeft, RotateCw } from "lucide-react";

export default function ExplorerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  function reloadAtlas() {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#view=atlas`,
    );
    window.location.reload();
  }

  return (
    <main className="explorer-loading-shell" role="alert">
      <p className="terminal-label">INTERFACE_ERROR</p>
      <h1>The regulatory atlas encountered a recoverable error.</h1>
      <p>{error.message || "The interface could not complete this request."}</p>
      <div>
        <button type="button" className="interface-back-button" onClick={reset}>
          <RotateCw aria-hidden="true" />
          TRY AGAIN
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
