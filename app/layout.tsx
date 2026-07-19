import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

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

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og-regulation-atlas-v2.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: {
      default: "Global AI · Data Regulation Map",
      template: "%s · Global AI Data Regulation Map",
    },
    description:
      "A versioned, provision-level knowledge graph for global AI governance, privacy, data security and cybersecurity regulation.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Global AI · Data Regulation Map",
      description:
        "Explore full legal corpora, provision-level mappings and time-aware regulatory status across jurisdictions.",
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1734,
          height: 907,
          alt: "Global AI Data Regulation Map bridging a dark knowledge graph and a bright legal research workspace",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Global AI · Data Regulation Map",
      description:
        "Explore full legal corpora, provision-level mappings and time-aware regulatory status across jurisdictions.",
      images: [socialImage],
    },
  };
}

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
