"use client";

import { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardOwnerProvider } from "./owner-context";
import { FocusContextProvider } from "@/lib/focus/focus-context";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardOwnerProvider>
      <FocusContextProvider>
        <AppShell>
          {children}
        </AppShell>
      </FocusContextProvider>
    </DashboardOwnerProvider>
  );
}