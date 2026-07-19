import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

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
  const socialImage = new URL("/og.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: {
      default: "Global AI · Data Regulation Map",
      template: "%s · Global AI Data Regulation Map",
    },
    description:
      "An open, evidence-linked crosswalk for global AI governance, privacy, data security and cybersecurity regulation.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Global AI · Data Regulation Map",
      description:
        "Trace one regulatory obligation across borders through an open, evidence-linked crosswalk.",
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1731,
          height: 909,
          alt: "Global AI Data Regulation Map crosswalk preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Global AI · Data Regulation Map",
      description:
        "Trace one regulatory obligation across borders through an open, evidence-linked crosswalk.",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
