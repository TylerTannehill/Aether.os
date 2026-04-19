import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aether.os",
  description: "Campaign Operating System",
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