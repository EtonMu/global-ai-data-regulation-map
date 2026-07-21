"use client";

import { useMemo } from "react";
import { ArrowLeft, Database } from "lucide-react";
import { buildResearchLabData } from "./research-lab-data";
import type { ResearchCorpusInput } from "./research-lab-data";
import { ResearchLab } from "./research-lab";
import type {
  ResearchCoverageScope,
  ResearchLabView,
  ResearchRelevanceScope,
} from "./research-lab";

export type LazyResearchViewProps = {
  input: ResearchCorpusInput;
  ready: boolean;
  errorMessage?: string | null;
  initialView: ResearchLabView;
  initialCoverageScope: ResearchCoverageScope;
  initialRelevanceScope: ResearchRelevanceScope;
  onViewChange: (view: ResearchLabView) => void;
  onCoverageScopeChange: (scope: ResearchCoverageScope) => void;
  onRelevanceScopeChange: (scope: ResearchRelevanceScope) => void;
  onRetry: () => void;
  onBackToAtlas: () => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenProvision: (provisionId: string) => void;
  onOpenConcept: (conceptId: string) => void;
};

export default function LazyResearchView({
  input,
  ready,
  errorMessage,
  initialView,
  initialCoverageScope,
  initialRelevanceScope,
  onViewChange,
  onCoverageScopeChange,
  onRelevanceScopeChange,
  onRetry,
  onBackToAtlas,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: LazyResearchViewProps) {
  const data = useMemo(
    () => (ready ? buildResearchLabData(input) : null),
    [input, ready],
  );

  if (errorMessage) {
    return (
      <section className="empty-state" role="alert">
        <span>RESEARCH_CORPUS_UNAVAILABLE</span>
        <h2>The complete research corpus did not finish loading.</h2>
        <p>{errorMessage}</p>
        <div>
          <button type="button" className="interface-back-button" onClick={onRetry}>
            <Database aria-hidden="true" />
            RETRY CORPUS
          </button>
          <button
            type="button"
            className="interface-back-button"
            onClick={onBackToAtlas}
          >
            <ArrowLeft aria-hidden="true" />
            BACK TO ATLAS
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="empty-state" aria-busy="true" aria-live="polite">
        <span>RESEARCH_CORPUS_LOADING</span>
        <h2>Loading the complete legal-text corpus.</h2>
        <p>
          Research calculations begin only after every instrument shard has been
          verified, so corpus-wide measurements remain comparable.
        </p>
      </section>
    );
  }

  return (
    <ResearchLab
      data={data}
      initialView={initialView}
      initialCoverageScope={initialCoverageScope}
      initialRelevanceScope={initialRelevanceScope}
      defaultInstrumentIds={[
        "eu-gdpr",
        "eu-ai-act",
        "cn-pipl",
        "us-nist-ai-rmf-1-0",
      ]}
      onViewChange={onViewChange}
      onCoverageScopeChange={onCoverageScopeChange}
      onRelevanceScopeChange={onRelevanceScopeChange}
      onOpenInstrument={onOpenInstrument}
      onOpenProvision={onOpenProvision}
      onOpenConcept={onOpenConcept}
    />
  );
}
