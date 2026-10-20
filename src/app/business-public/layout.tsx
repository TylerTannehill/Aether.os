import type { Metadata } from "next";
import businessOpenGraph from "../opengraph-business.png";

const title = "Aether Business | Business Operating System";
const description =
  "Built for businesses. Bring CRM, marketing, dispatch, inventory, finance, and daily operations together with Aether Business.";

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
        url: businessOpenGraph.src,
        width: businessOpenGraph.width,
        height: businessOpenGraph.height,
        alt: "Aether Business — Business Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [businessOpenGraph.src],
  },
};

export default function BusinessPublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
