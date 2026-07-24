import type { Metadata } from "next";
import "./globals.css";

const productionUrl = new URL(
  "https://global-ai-data-regulation-map.enjolras1832.chatgpt.site",
);

const themeBootstrap = `(() => {
  try {
    const stored = window.localStorage.getItem("gadrm-theme");
    const theme = stored === "dark" || stored === "bright"
      ? stored
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "bright"
        : "dark";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();`;

export const metadata: Metadata = {
  metadataBase: productionUrl,
  title: {
    default: "Compliance Compass: Global AI Governance and Data Regulation Map & Visualization",
    template: "%s · Compliance Compass",
  },
  description:
    "A versioned, provision-level knowledge graph for global AI governance, privacy, data security and cybersecurity regulation.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Compliance Compass: Global AI Governance and Data Regulation Map & Visualization",
    description:
      "Explore full legal corpora, provision-level mappings and time-aware regulatory status across jurisdictions.",
    type: "website",
    images: [
      {
        url: "/og-compliance-compass-v4.png",
        width: 1731,
        height: 909,
        alt: "Compliance Compass global AI governance and data regulation research visualization",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compliance Compass: Global AI Governance and Data Regulation Map & Visualization",
    description:
      "Explore full legal corpora, provision-level mappings and time-aware regulatory status across jurisdictions.",
    images: ["/og-compliance-compass-v4.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
