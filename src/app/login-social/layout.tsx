import type { Metadata } from "next";
import socialOpenGraph from "../opengraph-social.png";

const title = "Aether Social | Find Work & Make Connections";
const description =
  "Join Aether Social to discover job opportunities, build professional connections, and connect personally. A place to find work and have fun.";

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

export default function LoginSocialLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
