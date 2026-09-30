"use client";

import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function BusinessLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}