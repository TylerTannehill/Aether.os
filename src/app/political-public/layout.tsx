import type { Metadata } from "next";
import politicalOpenGraph from "../opengraph-political.png";

const title = "Aether Political | Campaign Operating System";
const description =
  "Deliver simplicity where campaigns have grown accustomed to complexity. Built by campaign people. Built for campaign people.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "Aether",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: politicalOpenGraph.src,
        width: politicalOpenGraph.width,
        height: politicalOpenGraph.height,
        alt: "Aether Political — Campaign Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [politicalOpenGraph.src],
  },
};

export default function PoliticalPublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
