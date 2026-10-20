import type { Metadata } from "next";
import academyOpenGraph from "../opengraph-academy.png";

const title = "Aether Academy | Expand Your Horizons";
const description =
  "Learn, build skills, and explore Aether Academy through training videos, guides, articles, and practical resources for Aether Political and Aether Business.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/aether-academy",
  },
  openGraph: {
    title,
    description,
    url: "https://aetheros.pro/aether-academy",
    siteName: "Aether",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: academyOpenGraph.src,
        width: academyOpenGraph.width,
        height: academyOpenGraph.height,
        alt: "Aether Academy — Expand Your Horizons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [academyOpenGraph.src],
  },
};

export default function AetherAcademyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
