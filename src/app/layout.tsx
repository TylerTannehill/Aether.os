import "./globals.css";
import type { Metadata } from "next";
import ecosystemOpenGraph from "./opengraph-ecosystem.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://aetheros.pro"),

  applicationName: "Aether",

  title: "Aether | Political, Business, Social & Academy",

  description:
    "Explore the Aether ecosystem: campaign operations, business management, professional networking, and training through Aether Political, Business, Social, and Academy.",

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
    "Aether Political",
    "Aether Business",
    "Aether Social",
    "Aether Academy",
    "Business Operating System",
    "Business Management Software",
    "Business Operations",
    "Business CRM",
    "Customer Relationship Management",
    "Business Dispatch",
    "Inventory Management",
    "Project Management",
    "Task Management",
    "Business Marketing",
    "Small Business Software",
    "Professional Networking",
    "Social Networking",
    "Professional Profiles",
    "Professional Connections",
    "Personal Connections",
    "Job Listings",
    "Job Opportunities",
    "Online Learning",
    "Training Videos",
    "Business Training",
    "Campaign Training",
    "Product Documentation",
    "Aether Ecosystem",
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
    title: "Aether | Political, Business, Social & Academy",
    description:
      "Explore the Aether ecosystem: campaign operations, business management, professional networking, and training through Aether Political, Business, Social, and Academy.",
    url: "https://aetheros.pro",
    siteName: "Aether",
    images: [
      {
        url: ecosystemOpenGraph.src,
        width: ecosystemOpenGraph.width,
        height: ecosystemOpenGraph.height,
        alt: "Aether ecosystem",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Aether | Political, Business, Social & Academy",
    description:
      "Explore the Aether ecosystem: campaign operations, business management, professional networking, and training through Aether Political, Business, Social, and Academy.",
    images: [ecosystemOpenGraph.src],
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
        "Aether Systems LLC develops software and educational resources for political campaigns, businesses, professional networks, and communities.",
    },
    {
      "@type": "WebSite",
      "@id": "https://aetheros.pro/#website",
      name: "Aether",
      url: "https://aetheros.pro",
      publisher: { "@id": "https://aetheros.pro/#organization" },
      description:
        "The Aether ecosystem brings together Political, Business, Social, and Academy.",
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