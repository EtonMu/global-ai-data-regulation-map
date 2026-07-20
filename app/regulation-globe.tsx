"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Move3d, Pause, Play } from "lucide-react";
import { ConceptIcon } from "./concept-icon";
import { JurisdictionMark } from "./jurisdiction-mark";
import styles from "./regulation-globe.module.css";

export type RegulationGlobeJurisdiction = {
  id: string;
  label: string;
  instrumentIds: readonly string[];
  primaryInstrumentId?: string | null;
};

export type RegulationGlobeConcept = {
  id: string;
  label: string;
  instrumentIds: readonly string[];
};

export type RegulationGlobeProps = {
  jurisdictions: readonly RegulationGlobeJurisdiction[];
  concepts: readonly RegulationGlobeConcept[];
  onOpenInstrument: (instrumentId: string) => void;
  onOpenConcept: (conceptId: string) => void;
  className?: string;
  /** Keeps a large corpus legible while still plotting a representative constellation. */
  maxConceptNodes?: number;
};

type Vector3 = { x: number; y: number; z: number };
type CanvasSize = { width: number; height: number; dpr: number };
type DragState = {
  pointerId: number;
  x: number;
  y: number;
} | null;

type Palette = {
  sphere: string;
  sphereAccent: string;
  jurisdiction: string;
  concept: string;
  connection: string;
  structure: string;
};

const POINT_COUNT = 920;
const ROTATION_SPEED = 0.00006;
const KEYBOARD_ROTATION_STEP = 0.09;

/**
 * Approximate regional anchors are used only to arrange nodes on this schematic
 * point globe; the visualization does not represent legal territorial bounds.
 */
const REGION_ANCHORS: Record<string, { latitude: number; longitude: number }> = {
  eu: { latitude: 50, longitude: 10 },
  us: { latitude: 38, longitude: -97 },
  cn: { latitude: 35, longitude: 103 },
  gb: { latitude: 55, longitude: -3 },
  ca: { latitude: 56, longitude: -106 },
  jp: { latitude: 36, longitude: 138 },
  in: { latitude: 21, longitude: 79 },
  int: { latitude: -18, longitude: -18 },
};

function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function createFibonacciSphere(count: number): Vector3[] {
  const points: Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    points.push({
      x: Math.cos(angle) * radial,
      y,
      z: Math.sin(angle) * radial,
    });
  }

  return points;
}

const SPHERE_POINTS = createFibonacciSphere(POINT_COUNT);

function stableAnchor(id: string, index: number) {
  const known = REGION_ANCHORS[id];
  if (known) return known;

  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return {
    latitude: -52 + ((hash + index * 19) % 105),
    longitude: -175 + ((hash * 7 + index * 43) % 350),
  };
}

function anchorToVector(latitude: number, longitude: number): Vector3 {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const latitudeScale = Math.cos(latitudeRadians);

  return {
    x: latitudeScale * Math.sin(longitudeRadians),
    y: -Math.sin(latitudeRadians),
    z: latitudeScale * Math.cos(longitudeRadians),
  };
}

function rotateVector(point: Vector3, yaw: number, pitch: number): Vector3 {
  const yawCos = Math.cos(yaw);
  const yawSin = Math.sin(yaw);
  const yawedX = point.x * yawCos + point.z * yawSin;
  const yawedZ = -point.x * yawSin + point.z * yawCos;
  const pitchCos = Math.cos(pitch);
  const pitchSin = Math.sin(pitch);

  return {
    x: yawedX,
    y: point.y * pitchCos - yawedZ * pitchSin,
    z: point.y * pitchSin + yawedZ * pitchCos,
  };
}

function sharedInstrumentCount(
  jurisdictionIds: ReadonlySet<string>,
  conceptIds: readonly string[],
) {
  let count = 0;
  for (const id of conceptIds) {
    if (jurisdictionIds.has(id)) count += 1;
  }
  return count;
}

function getCssVariable(style: CSSStyleDeclaration, name: string) {
  return style.getPropertyValue(name).trim() || "CanvasText";
}

function readPalette(): Palette {
  const computed = getComputedStyle(document.documentElement);
  return {
    sphere: getCssVariable(computed, "--muted"),
    sphereAccent: getCssVariable(computed, "--cyan"),
    jurisdiction: getCssVariable(computed, "--cyan"),
    concept: getCssVariable(computed, "--violet"),
    connection: getCssVariable(computed, "--violet"),
    structure: getCssVariable(computed, "--line-strong"),
  };
}

function connectionLabel(count: number) {
  return `${count} linked source${count === 1 ? "" : "s"}`;
}

export function RegulationGlobe({
  jurisdictions,
  concepts,
  onOpenInstrument,
  onOpenConcept,
  className,
  maxConceptNodes = 7,
}: RegulationGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });
  const paletteRef = useRef<Palette | null>(null);
  const yawRef = useRef(-0.14);
  const pitchRef = useRef(-0.08);
  const dragRef = useRef<DragState>(null);
  const activeKeyRef = useRef<string | null>(null);
  const requestDrawRef = useRef<() => void>(() => undefined);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const plottedConcepts = useMemo(
    () => concepts.slice(0, Math.max(1, maxConceptNodes)),
    [concepts, maxConceptNodes],
  );

  const jurisdictionVectors = useMemo(
    () =>
      jurisdictions.map((jurisdiction, index) => {
        const anchor = stableAnchor(jurisdiction.id, index);
        return {
          jurisdiction,
          vector: anchorToVector(anchor.latitude, anchor.longitude),
          instrumentSet: new Set(jurisdiction.instrumentIds),
        };
      }),
    [jurisdictions],
  );

  const connections = useMemo(
    () =>
      jurisdictionVectors.flatMap(({ jurisdiction, instrumentSet }) =>
        plottedConcepts.flatMap((concept) => {
          const count = sharedInstrumentCount(instrumentSet, concept.instrumentIds);
          return count > 0
            ? [{ jurisdictionId: jurisdiction.id, conceptId: concept.id, count }]
            : [];
        }),
      ),
    [jurisdictionVectors, plottedConcepts],
  );

  const conceptConnectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const connection of connections) {
      counts.set(
        connection.conceptId,
        (counts.get(connection.conceptId) ?? 0) + connection.count,
      );
    }
    return counts;
  }, [connections]);

  function setActiveNode(key: string | null) {
    activeKeyRef.current = key;
    setActiveKey(key);
    requestDrawRef.current();
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const refreshPalette = () => {
      paletteRef.current = readPalette();
      requestDrawRef.current();
    };
    refreshPalette();

    const observer = new MutationObserver(refreshPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      sizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      requestDrawRef.current();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let lastFrame = performance.now();
    const shouldAnimate = !motionPaused && !reducedMotion;

    const draw = (time: number) => {
      const { width, height, dpr } = sizeRef.current;
      if (width <= 1 || height <= 1) return;
      const palette = paletteRef.current ?? readPalette();
      paletteRef.current = palette;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";

      const radius = Math.max(66, Math.min(width * 0.335, height * 0.35));
      const centerX = width / 2;
      const centerY = height * 0.48;
      const yaw = yawRef.current;
      const pitch = pitchRef.current;
      const active = activeKeyRef.current;

      const conceptPositions = new Map<string, { x: number; y: number }>();
      plottedConcepts.forEach((concept, index) => {
        const count = Math.max(plottedConcepts.length, 1);
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2 + yaw * 0.12;
        const rawX = centerX + Math.cos(angle) * radius * 1.31;
        const rawY = centerY + Math.sin(angle) * radius * 1.05;
        conceptPositions.set(concept.id, {
          x: Math.max(11, Math.min(width - 11, rawX)),
          y: Math.max(11, Math.min(height - 11, rawY)),
        });
      });

      const projectedJurisdictions = new Map<
        string,
        { x: number; y: number; z: number }
      >();
      jurisdictionVectors.forEach(({ jurisdiction, vector }) => {
        const rotated = rotateVector(vector, yaw, pitch);
        const perspective = 0.94 + rotated.z * 0.06;
        projectedJurisdictions.set(jurisdiction.id, {
          x: centerX + rotated.x * radius * perspective,
          y: centerY + rotated.y * radius * perspective,
          z: rotated.z,
        });
      });

      // Evidence links sit behind the globe, then reappear as nodes on its surface.
      context.strokeStyle = palette.connection;
      for (const connection of connections) {
        const start = projectedJurisdictions.get(connection.jurisdictionId);
        const end = conceptPositions.get(connection.conceptId);
        if (!start || !end || start.z < -0.48) continue;
        const jurisdictionKey = `jurisdiction:${connection.jurisdictionId}`;
        const conceptKey = `concept:${connection.conceptId}`;
        const emphasized = active === jurisdictionKey || active === conceptKey;
        const middleX = (start.x + end.x) / 2;
        const middleY = (start.y + end.y) / 2;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const curve = Math.min(radius * 0.36, distance * 0.2);
        context.globalAlpha = emphasized
          ? 0.82
          : Math.max(0.12, 0.18 + start.z * 0.11);
        context.lineWidth = emphasized ? 1.7 : 0.8 + Math.min(connection.count, 3) * 0.12;
        context.setLineDash(emphasized ? [5, 4] : [2, 5]);
        context.lineDashOffset = reducedMotion || motionPaused ? 0 : -time * 0.012;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.quadraticCurveTo(
          middleX - (dy / distance) * curve,
          middleY + (dx / distance) * curve,
          end.x,
          end.y,
        );
        context.stroke();
      }
      context.setLineDash([]);

      // Thin structural rim keeps the point cloud legible in both themes.
      context.globalAlpha = 0.38;
      context.strokeStyle = palette.structure;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.stroke();

      const rotatedPoints = SPHERE_POINTS.map((point) =>
        rotateVector(point, yaw, pitch),
      ).sort((left, right) => left.z - right.z);

      for (const point of rotatedPoints) {
        const front = point.z >= 0;
        const perspective = 0.94 + point.z * 0.06;
        const x = centerX + point.x * radius * perspective;
        const y = centerY + point.y * radius * perspective;
        const pointRadius = front ? 0.7 + point.z * 0.8 : 0.55;
        context.globalAlpha = front
          ? 0.26 + point.z * 0.58
          : 0.055 + (point.z + 1) * 0.055;
        context.fillStyle = front ? palette.sphereAccent : palette.sphere;
        context.beginPath();
        context.arc(x, y, pointRadius, 0, Math.PI * 2);
        context.fill();
      }

      for (const { jurisdiction } of jurisdictionVectors) {
        const point = projectedJurisdictions.get(jurisdiction.id);
        if (!point) continue;
        const key = `jurisdiction:${jurisdiction.id}`;
        const emphasized = active === key;
        context.fillStyle = palette.jurisdiction;
        context.strokeStyle = palette.jurisdiction;
        context.globalAlpha = point.z < 0 ? 0.28 : emphasized ? 1 : 0.82;
        context.lineWidth = emphasized ? 2 : 1;
        context.beginPath();
        context.arc(point.x, point.y, emphasized ? 5.2 : 3.4, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha *= 0.56;
        context.beginPath();
        context.arc(point.x, point.y, emphasized ? 9.2 : 6.4, 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = palette.concept;
      context.strokeStyle = palette.concept;
      plottedConcepts.forEach((concept) => {
        const point = conceptPositions.get(concept.id);
        if (!point) return;
        const key = `concept:${concept.id}`;
        const emphasized = active === key;
        const nodeRadius = emphasized ? 5.8 : 4;
        context.globalAlpha = emphasized ? 1 : 0.86;
        context.lineWidth = emphasized ? 2 : 1.25;
        context.beginPath();
        context.moveTo(point.x, point.y - nodeRadius);
        context.lineTo(point.x + nodeRadius, point.y);
        context.lineTo(point.x, point.y + nodeRadius);
        context.lineTo(point.x - nodeRadius, point.y);
        context.closePath();
        context.stroke();
        context.globalAlpha = emphasized ? 0.48 : 0.22;
        context.fill();
      });

      context.globalAlpha = 1;
      context.setLineDash([]);
    };

    requestDrawRef.current = () => draw(performance.now());
    draw(lastFrame);

    if (shouldAnimate) {
      const animate = (time: number) => {
        const delta = Math.min(time - lastFrame, 34);
        lastFrame = time;
        if (!dragRef.current) yawRef.current += delta * ROTATION_SPEED;
        draw(time);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      requestDrawRef.current = () => undefined;
    };
  }, [
    connections,
    jurisdictionVectors,
    motionPaused,
    plottedConcepts,
    reducedMotion,
  ]);

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    yawRef.current += deltaX * 0.008;
    pitchRef.current = Math.max(
      -Math.PI * 0.42,
      Math.min(Math.PI * 0.42, pitchRef.current + deltaY * 0.006),
    );
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
    requestDrawRef.current();
  }

  function endPointerInteraction(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
  }

  function handleKeyboardRotation(event: ReactKeyboardEvent<HTMLElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const step = event.shiftKey
      ? KEYBOARD_ROTATION_STEP * 1.7
      : KEYBOARD_ROTATION_STEP;
    if (event.key === "ArrowLeft") yawRef.current -= step;
    if (event.key === "ArrowRight") yawRef.current += step;
    if (event.key === "ArrowUp") {
      pitchRef.current = Math.max(-Math.PI * 0.42, pitchRef.current - step);
    }
    if (event.key === "ArrowDown") {
      pitchRef.current = Math.min(Math.PI * 0.42, pitchRef.current + step);
    }
    requestDrawRef.current();
  }

  const displayedConceptCount = plottedConcepts.length;
  const hiddenConceptCount = Math.max(0, concepts.length - displayedConceptCount);
  const motionDisabled = reducedMotion;

  return (
    <section
      className={classNames(styles.panel, className)}
      aria-labelledby="regulation-globe-heading"
      onKeyDownCapture={handleKeyboardRotation}
    >
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <span className={styles.eyebrow}>GLOBAL ATLAS · RELATION GRAPH</span>
          <h2 id="regulation-globe-heading">Regulation ↔ concept globe</h2>
        </div>
        <button
          type="button"
          className={styles.motionButton}
          onClick={() => setMotionPaused((paused) => !paused)}
          disabled={motionDisabled}
          aria-pressed={motionPaused || motionDisabled}
          aria-label={
            motionDisabled
              ? "Automatic rotation disabled by reduced-motion preference"
              : motionPaused
                ? "Resume automatic globe rotation"
                : "Pause automatic globe rotation"
          }
        >
          {motionPaused || motionDisabled ? (
            <Play aria-hidden="true" />
          ) : (
            <Pause aria-hidden="true" />
          )}
          <span>
            {motionDisabled ? "Motion off" : motionPaused ? "Resume" : "Pause"}
          </span>
        </button>
      </header>

      <figure className={styles.figure}>
        <div
          ref={stageRef}
          className={classNames(styles.stage, isDragging && styles.isDragging)}
        >
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            role="img"
            aria-label={`${jurisdictions.length} jurisdiction nodes connected to ${displayedConceptCount} core concept nodes by shared legal instruments on a rotating point-cloud globe.`}
            aria-describedby="regulation-globe-instructions"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerInteraction}
            onPointerCancel={endPointerInteraction}
          >
            An interactive point-cloud globe showing shared legal sources between
            jurisdictions and core concepts. Use the buttons following the globe
            for an equivalent keyboard-accessible view.
          </canvas>
          <div className={styles.visualKey} aria-hidden="true">
            <span><i className={styles.jurisdictionDot} />Jurisdiction</span>
            <span><i className={styles.conceptDiamond} />Core concept</span>
          </div>
        </div>
        <figcaption id="regulation-globe-instructions" className={styles.instructions}>
          <Move3d aria-hidden="true" />
          <span>Drag to rotate. Focus a node and use arrow keys.</span>
          {hiddenConceptCount > 0 ? (
            <span>{displayedConceptCount} of {concepts.length} concepts plotted.</span>
          ) : null}
        </figcaption>
      </figure>

      <div className={styles.nodeDirectory}>
        <nav aria-label="Jurisdictions plotted on the regulation globe">
          <h3>Jurisdictions</h3>
          <div className={styles.jurisdictionGrid}>
            {jurisdictions.map((jurisdiction) => {
              const primaryInstrumentId =
                jurisdiction.primaryInstrumentId ?? jurisdiction.instrumentIds[0];
              const key = `jurisdiction:${jurisdiction.id}`;
              return (
                <button
                  key={jurisdiction.id}
                  type="button"
                  className={classNames(
                    styles.nodeButton,
                    styles.jurisdictionButton,
                    activeKey === key && styles.isActive,
                  )}
                  disabled={!primaryInstrumentId}
                  onClick={() => {
                    if (primaryInstrumentId) onOpenInstrument(primaryInstrumentId);
                  }}
                  onFocus={() => setActiveNode(key)}
                  onBlur={() => setActiveNode(null)}
                  onPointerEnter={() => setActiveNode(key)}
                  onPointerLeave={() => setActiveNode(null)}
                  aria-label={`Open ${jurisdiction.label}; ${connectionLabel(jurisdiction.instrumentIds.length)}`}
                >
                  <JurisdictionMark jurisdictionId={jurisdiction.id} small />
                  <span>{jurisdiction.label}</span>
                  <b aria-hidden="true">{jurisdiction.instrumentIds.length}</b>
                </button>
              );
            })}
          </div>
        </nav>

        <nav aria-label="Core concepts connected on the regulation globe">
          <h3>Core concepts</h3>
          <div className={styles.conceptGrid}>
            {plottedConcepts.map((concept) => {
              const key = `concept:${concept.id}`;
              const linkCount = conceptConnectionCounts.get(concept.id) ?? 0;
              return (
                <button
                  key={concept.id}
                  type="button"
                  className={classNames(
                    styles.nodeButton,
                    styles.conceptButton,
                    activeKey === key && styles.isActive,
                  )}
                  onClick={() => onOpenConcept(concept.id)}
                  onFocus={() => setActiveNode(key)}
                  onBlur={() => setActiveNode(null)}
                  onPointerEnter={() => setActiveNode(key)}
                  onPointerLeave={() => setActiveNode(null)}
                  aria-label={`Open core concept ${concept.label}; ${connectionLabel(linkCount)}`}
                >
                  <ConceptIcon conceptId={concept.id} size={17} />
                  <span>{concept.label}</span>
                  <b aria-hidden="true">{linkCount}</b>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
