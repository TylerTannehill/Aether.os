import type { Metadata } from "next";
import socialOpenGraph from "../opengraph-social.png";

const title = "Aether Social | Find Work & Make Connections";
const description =
  "Discover job opportunities, build professional connections, and connect personally with people who matter to you on Aether Social.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/social-public",
  },
  openGraph: {
    title,
    description,
    url: "https://aetheros.pro/social-public",
    siteName: "Aether Social",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: socialOpenGraph.src,
        width: socialOpenGraph.width,
        height: socialOpenGraph.height,
        alt: "Aether Social — Find Work & Make Connections",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialOpenGraph.src],
  },
};

export default function SocialPublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
