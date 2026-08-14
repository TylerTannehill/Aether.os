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

  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
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

  alternates: {
    canonical: "/",
  },

  category: "Technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://aetheros.pro/#organization",
      name: "Aether Systems LLC",
      alternateName: "Team Aether",
      url: "https://aetheros.pro",
      logo: "https://aetheros.pro/aether-logo-full.png",
      description:
        "Aether Systems LLC develops Aether, the Campaign Operating System built by campaign people for campaign people.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://aetheros.pro/#software",
      name: "Aether",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      url: "https://aetheros.pro",
      publisher: {
        "@id": "https://aetheros.pro/#organization",
      },
      description:
        "Aether is a Campaign Operating System that helps campaign teams manage finance, field, outreach, digital, print, contacts, lists, analytics, and execution from a single platform.",
      subjectOf: {
        "@type": "WebPage",
        name: "Aether Academy",
        url: "https://aetheros.pro/aether-academy",
        description:
          "The official learning center and documentation library for Aether, providing training videos, articles, product updates, and educational resources about the Campaign Operating System.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        {children}
        <script
          src="https://aetheros.pro/aether-tracker.js"
          data-aether-tracker="aether_track_fed5b8d67525f56133e2742c4419998a"
          defer
        />
      </body>
    </html>
  );
}