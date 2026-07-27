import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://aetheros.pro"),

  applicationName: "Aether",

  title: "Aether | Campaign Operating System",

  description:
    "Deliver simplicity where campaigns have grown accustomed to complexity. Built by campaign people. Built for campaign people.",

  keywords: [
    "Aether",
    "Campaign Operating System",
    "Campaign Software",
    "Political Campaign Software",
    "Campaign Management",
    "Campaign CRM",
    "Campaign Organization",
    "Campaign Operations",
    "Political Technology",
    "Campaign Finance",
    "Campaign Fundraising",
    "Political Fundraising",
    "Field Operations",
    "Door Knocking",
    "Voter Outreach",
    "Volunteer Management",
    "Campaign Digital",
    "Campaign Print",
    "Campaign Dashboard",
    "Campaign Workflow",
    "Campaign Productivity",
    "Campaign Staff",
    "Campaign Teams",
    "Campaign Organizing",
    "Campaign Communications",
    "Election Technology",
    "Political SaaS",
    "Campaign Platform",
    "Political Campaign Management",
  ],

  authors: [
    {
      name: "Team Aether",
      url: "https://aetheros.pro",
    },
  ],

  creator: "Team Aether",
  publisher: "Aether",

  referrer: "origin-when-cross-origin",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    title: "Aether | Campaign Operating System",
    description:
      "Deliver simplicity where campaigns have grown accustomed to complexity. Built by campaign people. Built for campaign people.",
    url: "https://aetheros.pro",
    siteName: "Aether",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Aether Campaign Operating System",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Aether | Campaign Operating System",
    description:
      "Deliver simplicity where campaigns have grown accustomed to complexity. Built by campaign people. Built for campaign people.",
    images: ["/opengraph-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "Technology",
};

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