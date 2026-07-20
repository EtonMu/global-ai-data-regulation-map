"use client";

import {
  type CSSProperties,
  useId,
  useMemo,
  useState,
} from "react";
import { BookOpenText, Network } from "lucide-react";
import { ConceptIcon, ConceptThemeIcon } from "./concept-icon";
import { JurisdictionMark } from "./jurisdiction-mark";
import styles from "./concept-constellation.module.css";

export type ConceptConstellationTheme = {
  id: string;
  label: string;
  summary?: string;
};

export type ConceptConstellationConcept = {
  id: string;
  label: string;
  themeId: string;
  instrumentIds: readonly string[];
};

export type ConceptConstellationInstrument = {
  id: string;
  label: string;
  shortLabel?: string;
  jurisdictionId: string;
  jurisdictionLabel?: string;
};

export type ConceptConstellationProps = {
  themes: readonly ConceptConstellationTheme[];
  concepts: readonly ConceptConstellationConcept[];
  instruments: readonly ConceptConstellationInstrument[];
  selectedConceptId?: string | null;
  onOpenConcept: (conceptId: string) => void;
  onOpenInstrument: (instrumentId: string) => void;
  className?: string;
  maxSourceNodes?: number;
};

type Point = { x: number; y: number };

type Readout = {
  icon: "concept" | "theme" | "source";
  id: string;
  label: string;
  context: string;
};

const CENTER = 50;
const CONCEPT_RADIUS = 39;
const THEME_RADIUS = 24;
const SOURCE_RADIUS = 13;
const START_ANGLE = -Math.PI / 2;

function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function pointOnRing(index: number, count: number, radius: number): Point {
  const angle = START_ANGLE + (index / Math.max(1, count)) * Math.PI * 2;
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function circularMean(points: readonly Point[]): Point | null {
  if (!points.length) return null;

  let vectorX = 0;
  let vectorY = 0;
  for (const point of points) {
    const angle = Math.atan2(point.y - CENTER, point.x - CENTER);
    vectorX += Math.cos(angle);
    vectorY += Math.sin(angle);
  }

  if (Math.abs(vectorX) + Math.abs(vectorY) < 0.001) return null;
  const meanAngle = Math.atan2(vectorY, vectorX);
  return {
    x: CENTER + Math.cos(meanAngle) * THEME_RADIUS,
    y: CENTER + Math.sin(meanAngle) * THEME_RADIUS,
  };
}

function nodeStyle(point: Point): CSSProperties {
  return { left: `${point.x}%`, top: `${point.y}%` };
}

function deduplicate(values: readonly string[]) {
  return Array.from(new Set(values));
}

/**
 * A deterministic, evidence-led concept graph for the explorer's right panel.
 * Themes occupy the inner filled orbit, individual concepts the outline orbit,
 * and the active concept's legal sources form the evidence cluster at center.
 */
export function ConceptConstellation({
  themes,
  concepts,
  instruments,
  selectedConceptId,
  onOpenConcept,
  onOpenInstrument,
  className,
  maxSourceNodes = 7,
}: ConceptConstellationProps) {
  const titleId = useId();
  const orderedConcepts = useMemo(() => {
    const themeOrder = new Map(themes.map((theme, index) => [theme.id, index]));
    return concepts
      .map((concept, index) => ({ concept, index }))
      .sort((left, right) => {
        const themeDelta =
          (themeOrder.get(left.concept.themeId) ?? themes.length) -
          (themeOrder.get(right.concept.themeId) ?? themes.length);
        return themeDelta || left.index - right.index;
      })
      .map(({ concept }) => concept);
  }, [concepts, themes]);

  const conceptById = useMemo(
    () => new Map(concepts.map((concept) => [concept.id, concept])),
    [concepts],
  );
  const instrumentById = useMemo(
    () => new Map(instruments.map((instrument) => [instrument.id, instrument])),
    [instruments],
  );
  const conceptPositions = useMemo(
    () =>
      new Map(
        orderedConcepts.map((concept, index) => [
          concept.id,
          pointOnRing(index, orderedConcepts.length, CONCEPT_RADIUS),
        ]),
      ),
    [orderedConcepts],
  );

  const themePositions = useMemo(
    () =>
      new Map(
        themes.map((theme, index) => {
          const linkedPoints = orderedConcepts
            .filter((concept) => concept.themeId === theme.id)
            .map((concept) => conceptPositions.get(concept.id))
            .filter((point): point is Point => Boolean(point));
          return [
            theme.id,
            circularMean(linkedPoints) ??
              pointOnRing(index, themes.length, THEME_RADIUS),
          ];
        }),
      ),
    [conceptPositions, orderedConcepts, themes],
  );

  const fallbackConceptId = useMemo(() => {
    const selected = selectedConceptId && conceptById.has(selectedConceptId)
      ? selectedConceptId
      : null;
    return (
      selected ??
      [...orderedConcepts].sort(
        (left, right) => right.instrumentIds.length - left.instrumentIds.length,
      )[0]?.id ??
      null
    );
  }, [conceptById, orderedConcepts, selectedConceptId]);

  const [optimisticSelection, setOptimisticSelection] = useState<{
    conceptId: string;
    selectedProp: string | null;
  } | null>(null);
  const [previewConceptId, setPreviewConceptId] = useState<string | null>(null);
  const [readout, setReadout] = useState<Readout | null>(null);

  const selectedProp = selectedConceptId ?? null;
  const optimisticConceptId =
    optimisticSelection?.selectedProp === selectedProp &&
    conceptById.has(optimisticSelection.conceptId)
      ? optimisticSelection.conceptId
      : null;

  const activeConceptId =
    (previewConceptId && conceptById.has(previewConceptId)
      ? previewConceptId
      : optimisticConceptId) ?? fallbackConceptId;
  const activeConcept = activeConceptId
    ? conceptById.get(activeConceptId)
    : undefined;

  const activeInstruments = useMemo(() => {
    if (!activeConcept) return [];
    return deduplicate(activeConcept.instrumentIds)
      .map((id) => instrumentById.get(id))
      .filter((instrument): instrument is ConceptConstellationInstrument =>
        Boolean(instrument),
      )
      .slice(0, Math.max(1, maxSourceNodes));
  }, [activeConcept, instrumentById, maxSourceNodes]);

  const sourcePositions = useMemo(
    () =>
      new Map(
        activeInstruments.map((instrument, index) => [
          instrument.id,
          pointOnRing(index, activeInstruments.length, SOURCE_RADIUS),
        ]),
      ),
    [activeInstruments],
  );

  const activeThemeId = activeConcept?.themeId ?? null;
  const hiddenSourceCount = Math.max(
    0,
    (activeConcept?.instrumentIds.length ?? 0) - activeInstruments.length,
  );
  const defaultReadout: Readout | null = activeConcept
    ? {
        icon: "concept",
        id: activeConcept.id,
        label: activeConcept.label,
        context: `${activeConcept.instrumentIds.length} indexed legal source${
          activeConcept.instrumentIds.length === 1 ? "" : "s"
        } across the corpus`,
      }
    : null;
  const displayedReadout = readout ?? defaultReadout;

  function previewConcept(concept: ConceptConstellationConcept) {
    setPreviewConceptId(concept.id);
    setReadout({
      icon: "concept",
      id: concept.id,
      label: concept.label,
      context: `${concept.instrumentIds.length} indexed legal source${
        concept.instrumentIds.length === 1 ? "" : "s"
      }`,
    });
  }

  function clearPreview() {
    setPreviewConceptId(null);
    setReadout(null);
  }

  function focusTheme(theme: ConceptConstellationTheme) {
    const representative = orderedConcepts
      .filter((concept) => concept.themeId === theme.id)
      .sort((left, right) => right.instrumentIds.length - left.instrumentIds.length)[0];
    if (representative) setPreviewConceptId(representative.id);
    setReadout({
      icon: "theme",
      id: theme.id,
      label: theme.label,
      context:
        theme.summary ??
        `${orderedConcepts.filter((concept) => concept.themeId === theme.id).length} concepts in this theme`,
    });
  }

  function pinTheme(theme: ConceptConstellationTheme) {
    const representative = orderedConcepts
      .filter((concept) => concept.themeId === theme.id)
      .sort((left, right) => right.instrumentIds.length - left.instrumentIds.length)[0];
    if (representative) {
      setOptimisticSelection({
        conceptId: representative.id,
        selectedProp,
      });
    }
    setPreviewConceptId(null);
    setReadout(null);
  }

  return (
    <section
      className={classNames(styles.panel, className)}
      aria-labelledby={titleId}
      data-active-concept={activeConceptId ?? undefined}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>COMPARATIVE CONCEPT TOPOLOGY</span>
          <h2 id={titleId}>Concept–source constellation</h2>
        </div>
        <span className={styles.coverage} aria-label="Constellation coverage">
          {themes.length}T · {concepts.length}C · {instruments.length}S
        </span>
      </header>

      <figure className={styles.figure}>
        <div
          className={styles.stage}
          role="group"
          aria-label={`${themes.length} concept themes, ${concepts.length} individual concepts, and the legal sources linked to the active concept.`}
        >
          <svg
            className={styles.edges}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {orderedConcepts.map((concept) => {
              const conceptPoint = conceptPositions.get(concept.id);
              const themePoint = themePositions.get(concept.themeId);
              if (!conceptPoint || !themePoint) return null;
              const active = concept.id === activeConceptId;
              return (
                <line
                  key={`theme-edge-${concept.id}`}
                  className={classNames(
                    styles.themeEdge,
                    active && styles.activeThemeEdge,
                  )}
                  x1={conceptPoint.x}
                  y1={conceptPoint.y}
                  x2={themePoint.x}
                  y2={themePoint.y}
                />
              );
            })}
            {activeConceptId && conceptPositions.get(activeConceptId)
              ? activeInstruments.map((instrument) => {
                  const conceptPoint = conceptPositions.get(activeConceptId);
                  const sourcePoint = sourcePositions.get(instrument.id);
                  if (!conceptPoint || !sourcePoint) return null;
                  return (
                    <line
                      key={`source-edge-${instrument.id}`}
                      className={styles.sourceEdge}
                      x1={conceptPoint.x}
                      y1={conceptPoint.y}
                      x2={sourcePoint.x}
                      y2={sourcePoint.y}
                    />
                  );
                })
              : null}
          </svg>

          <span className={styles.evidenceCore} aria-hidden="true">
            <Network />
          </span>

          {themes.map((theme) => {
            const point = themePositions.get(theme.id);
            if (!point) return null;
            const count = orderedConcepts.filter(
              (concept) => concept.themeId === theme.id,
            ).length;
            return (
              <button
                key={theme.id}
                type="button"
                className={classNames(
                  styles.node,
                  styles.themeNode,
                  theme.id === activeThemeId && styles.isActive,
                )}
                style={nodeStyle(point)}
                aria-pressed={theme.id === activeThemeId}
                aria-label={`Focus theme ${theme.label}; ${count} concepts`}
                onClick={() => pinTheme(theme)}
                onFocus={() => focusTheme(theme)}
                onBlur={clearPreview}
                onPointerEnter={() => focusTheme(theme)}
                onPointerLeave={clearPreview}
              >
                <ConceptThemeIcon themeId={theme.id} size="100%" />
              </button>
            );
          })}

          {orderedConcepts.map((concept) => {
            const point = conceptPositions.get(concept.id);
            if (!point) return null;
            const active = concept.id === activeConceptId;
            return (
              <button
                key={concept.id}
                type="button"
                className={classNames(
                  styles.node,
                  styles.conceptNode,
                  active && styles.isActive,
                )}
                style={nodeStyle(point)}
                aria-pressed={active}
                aria-label={`Open core concept ${concept.label}; ${concept.instrumentIds.length} linked sources`}
                onClick={() => {
                  setOptimisticSelection({
                    conceptId: concept.id,
                    selectedProp,
                  });
                  onOpenConcept(concept.id);
                }}
                onFocus={() => previewConcept(concept)}
                onBlur={clearPreview}
                onPointerEnter={() => previewConcept(concept)}
                onPointerLeave={clearPreview}
              >
                <ConceptIcon conceptId={concept.id} size={16} />
              </button>
            );
          })}

          {activeInstruments.map((instrument) => {
            const point = sourcePositions.get(instrument.id);
            if (!point) return null;
            return (
              <button
                key={instrument.id}
                type="button"
                className={classNames(styles.node, styles.sourceNode)}
                style={nodeStyle(point)}
                aria-label={`Open legal source ${instrument.label}; ${
                  instrument.jurisdictionLabel ?? instrument.jurisdictionId
                }`}
                onClick={() => onOpenInstrument(instrument.id)}
                onFocus={() =>
                  setReadout({
                    icon: "source",
                    id: instrument.id,
                    label: instrument.label,
                    context:
                      instrument.jurisdictionLabel ?? instrument.jurisdictionId,
                  })
                }
                onBlur={() => setReadout(null)}
                onPointerEnter={() =>
                  setReadout({
                    icon: "source",
                    id: instrument.id,
                    label: instrument.label,
                    context:
                      instrument.jurisdictionLabel ?? instrument.jurisdictionId,
                  })
                }
                onPointerLeave={() => setReadout(null)}
              >
                <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
              </button>
            );
          })}

          {!activeInstruments.length ? (
            <span className={styles.emptyEvidence}>No indexed source</span>
          ) : null}
        </div>

        <figcaption className={styles.legend}>
          <span><i className={styles.filledKey} />Theme</span>
          <span><i className={styles.outlineKey} />Concept</span>
          <span><i className={styles.sourceKey} />Legal source / jurisdiction</span>
        </figcaption>
      </figure>

      {displayedReadout ? (
        <div className={styles.readout} aria-live="polite" aria-atomic="true">
          <span className={styles.readoutIcon} aria-hidden="true">
            {displayedReadout.icon === "theme" ? (
              <ConceptThemeIcon themeId={displayedReadout.id} size={30} />
            ) : displayedReadout.icon === "source" ? (
              <BookOpenText />
            ) : (
              <ConceptIcon conceptId={displayedReadout.id} size={18} />
            )}
          </span>
          <span className={styles.readoutText}>
            <strong>{displayedReadout.label}</strong>
            <small>{displayedReadout.context}</small>
          </span>
          {hiddenSourceCount > 0 && displayedReadout.icon === "concept" ? (
            <span className={styles.overflowCount}>+{hiddenSourceCount} sources</span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
