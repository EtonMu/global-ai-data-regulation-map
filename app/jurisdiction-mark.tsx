import {
  BadgeCheck,
  Building2,
  CircleHelp,
  Cpu,
  Globe2,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import EUFlag from "country-flag-icons/react/3x2/EU";
import USFlag from "country-flag-icons/react/3x2/US";
import CNFlag from "country-flag-icons/react/3x2/CN";
import GBFlag from "country-flag-icons/react/3x2/GB";
import CAFlag from "country-flag-icons/react/3x2/CA";
import JPFlag from "country-flag-icons/react/3x2/JP";
import INFlag from "country-flag-icons/react/3x2/IN";

const flagMarks = {
  eu: { code: "EU", component: EUFlag },
  us: { code: "US", component: USFlag },
  "us-ca": { code: "US", component: USFlag },
  cn: { code: "CN", component: CNFlag },
  gb: { code: "GB", component: GBFlag },
  ca: { code: "CA", component: CAFlag },
  jp: { code: "JP", component: JPFlag },
  in: { code: "IN", component: INFlag },
} as const;

const issuerMarks: Record<
  string,
  { abbreviation: string; label: string; icon: LucideIcon }
> = {
  int: {
    abbreviation: "INT",
    label: "International frameworks and soft law",
    icon: Globe2,
  },
  g7: { abbreviation: "G7", label: "Group of Seven", icon: UsersRound },
  un: { abbreviation: "UN", label: "United Nations", icon: Building2 },
  "iso-iec": {
    abbreviation: "ISO",
    label: "ISO and IEC",
    icon: BadgeCheck,
  },
  ieee: {
    abbreviation: "IEEE",
    label: "Institute of Electrical and Electronics Engineers",
    icon: Cpu,
  },
  oecd: {
    abbreviation: "OECD",
    label: "Organisation for Economic Co-operation and Development",
    icon: Globe2,
  },
  "ai-safety-summit": {
    abbreviation: "AISS",
    label: "AI Safety Summit",
    icon: ShieldCheck,
  },
};

const unknownMark = {
  abbreviation: "—",
  label: "Unknown jurisdiction or issuing body",
  icon: CircleHelp,
};

type JurisdictionMarkProps = {
  jurisdictionId: string;
  small?: boolean;
};

export function JurisdictionMark({
  jurisdictionId,
  small = false,
}: JurisdictionMarkProps) {
  const flag = flagMarks[jurisdictionId as keyof typeof flagMarks];
  const sizeClass = small ? " is-small" : "";

  if (flag) {
    const Flag = flag.component;
    return (
      <span
        className={"jurisdiction-mark is-flag" + sizeClass}
        data-flag-code={flag.code}
        aria-hidden="true"
      >
        <Flag />
      </span>
    );
  }

  const issuer = issuerMarks[jurisdictionId] ?? unknownMark;
  const Icon = issuer.icon;
  return (
    <span
      className={"jurisdiction-mark is-issuer" + sizeClass}
      data-issuer-id={issuerMarks[jurisdictionId] ? jurisdictionId : "unknown"}
      aria-label={issuer.label}
      role="img"
    >
      <Icon aria-hidden="true" />
      <span aria-hidden="true">{issuer.abbreviation}</span>
    </span>
  );
}
