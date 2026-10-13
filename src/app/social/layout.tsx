import type { ReactNode } from "react";
import { SocialShell } from "@/components/layout/social-shell";

export default function SocialLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SocialShell>{children}</SocialShell>;
}
