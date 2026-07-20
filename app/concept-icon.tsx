import type { CSSProperties } from "react";
import {
  Activity,
  BadgeCheck,
  Blocks,
  Bot,
  BrainCircuit,
  CircleHelp,
  ClipboardCheck,
  Database,
  EarthLock,
  Fingerprint,
  Gauge,
  Globe2,
  Hand,
  ListFilter,
  LockKeyhole,
  Network,
  Scale,
  ScanEye,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Stamp,
  Target,
  TimerReset,
  UserRoundCheck,
  UserRoundCog,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import styles from "./concept-icon.module.css";

export const CONCEPT_IDS = [
  "privacy-by-design-default",
  "data-minimization",
  "purpose-limitation",
  "lawfulness-consent-choice",
  "automated-decision-safeguards",
  "data-subject-rights",
  "transparency-explainability",
  "fairness-nondiscrimination",
  "sensitive-data-protection",
  "training-data-governance",
  "retention-deletion-lifecycle",
  "cross-border-transfer",
  "ai-risk-management",
  "impact-assessment",
  "accountability-governance",
  "third-party-supply-chain",
  "continuous-assurance",
  "security-controls",
  "privacy-enhancing-tech",
  "incident-response",
  "human-oversight",
  "frontier-model-safety",
  "global-coordination",
] as const;

export type ConceptId = (typeof CONCEPT_IDS)[number];

export const CONCEPT_THEME_IDS = [
  "privacy-principles",
  "rights-and-fairness",
  "data-lifecycle",
  "governance-and-assurance",
  "security-and-resilience",
  "ai-safety-and-oversight",
  "international-coordination",
] as const;

export type ConceptThemeId = (typeof CONCEPT_THEME_IDS)[number];

type IconDefinition = {
  icon: LucideIcon;
  label: string;
};

/**
 * Each stable concept ID intentionally owns a distinct outline glyph. Keep this
 * as an exhaustive Record so adding a concept requires an explicit icon choice.
 */
export const conceptIconMap: Record<ConceptId, IconDefinition> = {
  "privacy-by-design-default": {
    icon: Blocks,
    label: "Privacy by Design and Default",
  },
  "data-minimization": {
    icon: ListFilter,
    label: "Data Minimization",
  },
  "purpose-limitation": {
    icon: Target,
    label: "Purpose Limitation",
  },
  "lawfulness-consent-choice": {
    icon: Stamp,
    label: "Lawfulness, Consent and Choice",
  },
  "automated-decision-safeguards": {
    icon: Bot,
    label: "Automated Decision Safeguards",
  },
  "data-subject-rights": {
    icon: Hand,
    label: "Individual and Data Subject Rights",
  },
  "transparency-explainability": {
    icon: ScanEye,
    label: "Transparency, Notice and Explainability",
  },
  "fairness-nondiscrimination": {
    icon: Scale,
    label: "Fairness and Non-discrimination",
  },
  "sensitive-data-protection": {
    icon: ShieldAlert,
    label: "Sensitive Data and Vulnerable People",
  },
  "training-data-governance": {
    icon: Database,
    label: "Training-data Governance",
  },
  "retention-deletion-lifecycle": {
    icon: TimerReset,
    label: "Retention, Deletion and Data Lifecycle",
  },
  "cross-border-transfer": {
    icon: EarthLock,
    label: "Cross-border Data Governance",
  },
  "ai-risk-management": {
    icon: Gauge,
    label: "AI Risk Management",
  },
  "impact-assessment": {
    icon: ScanSearch,
    label: "Risk and Impact Assessment",
  },
  "accountability-governance": {
    icon: UserRoundCog,
    label: "Accountability, Roles and Documentation",
  },
  "third-party-supply-chain": {
    icon: Network,
    label: "Third-party and Supply-chain Governance",
  },
  "continuous-assurance": {
    icon: Activity,
    label: "Continuous Monitoring, Audit and Metrics",
  },
  "security-controls": {
    icon: LockKeyhole,
    label: "Security, Resilience and Least Privilege",
  },
  "privacy-enhancing-tech": {
    icon: Fingerprint,
    label: "Privacy-enhancing Technologies",
  },
  "incident-response": {
    icon: Siren,
    label: "Incident Response, Notification and Redress",
  },
  "human-oversight": {
    icon: UserRoundCheck,
    label: "Human Oversight",
  },
  "frontier-model-safety": {
    icon: BrainCircuit,
    label: "Frontier-model Safety",
  },
  "global-coordination": {
    icon: Globe2,
    label: "Global AI Coordination",
  },
};

/** Theme icons are rendered inside a solid badge to distinguish major groups. */
export const conceptThemeIconMap: Record<ConceptThemeId, IconDefinition> = {
  "privacy-principles": {
    icon: ShieldCheck,
    label: "Privacy principles",
  },
  "rights-and-fairness": {
    icon: BadgeCheck,
    label: "Rights, transparency and fairness",
  },
  "data-lifecycle": {
    icon: Database,
    label: "Data lifecycle and transfers",
  },
  "governance-and-assurance": {
    icon: ClipboardCheck,
    label: "Governance, risk and assurance",
  },
  "security-and-resilience": {
    icon: Shield,
    label: "Security and resilience",
  },
  "ai-safety-and-oversight": {
    icon: Sparkles,
    label: "AI safety and oversight",
  },
  "international-coordination": {
    icon: Globe2,
    label: "International coordination",
  },
};

export function isConceptId(value: string): value is ConceptId {
  return Object.hasOwn(conceptIconMap, value);
}

export function isConceptThemeId(value: string): value is ConceptThemeId {
  return Object.hasOwn(conceptThemeIconMap, value);
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

type AccessibilityProps = {
  /** Decorative by default because concept names normally sit beside the icon. */
  decorative?: boolean;
  /** Used as the accessible name when `decorative` is false. */
  label?: string;
};

export type ConceptIconProps = AccessibilityProps &
  Omit<LucideProps, "aria-hidden" | "aria-label" | "role"> & {
    conceptId: string;
  };

/** Renders the concept-level treatment: one unique Lucide outline glyph. */
export function ConceptIcon({
  conceptId,
  decorative = true,
  label,
  className,
  size = 18,
  strokeWidth = 1.75,
  absoluteStrokeWidth = true,
  ...iconProps
}: ConceptIconProps) {
  const definition = isConceptId(conceptId)
    ? conceptIconMap[conceptId]
    : { icon: CircleHelp, label: "Unknown core concept" };
  const Icon = definition.icon;
  const accessibility = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "img",
        "aria-label": label ?? definition.label,
      } as const);

  return (
    <Icon
      {...iconProps}
      {...accessibility}
      className={classNames(styles.lineIcon, className)}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
      focusable="false"
      data-concept-id={conceptId}
      data-icon-treatment="outline"
    />
  );
}

export type ConceptThemeIconProps = AccessibilityProps & {
  themeId: string;
  className?: string;
  style?: CSSProperties;
  size?: CSSProperties["inlineSize"];
  iconStrokeWidth?: number;
};

/** Renders the major/theme treatment: a theme glyph inside a solid badge. */
export function ConceptThemeIcon({
  themeId,
  decorative = true,
  label,
  className,
  style,
  size = 28,
  iconStrokeWidth = 2,
}: ConceptThemeIconProps) {
  const definition = isConceptThemeId(themeId)
    ? conceptThemeIconMap[themeId]
    : { icon: CircleHelp, label: "Unknown concept theme" };
  const Icon = definition.icon;
  const accessibility = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "img",
        "aria-label": label ?? definition.label,
      } as const);

  return (
    <span
      {...accessibility}
      className={classNames(styles.themeBadge, className)}
      style={{ inlineSize: size, blockSize: size, ...style }}
      data-concept-theme-id={themeId}
      data-icon-treatment="solid"
    >
      <Icon
        className={styles.themeGlyph}
        strokeWidth={iconStrokeWidth}
        absoluteStrokeWidth
        aria-hidden="true"
        focusable="false"
      />
    </span>
  );
}
