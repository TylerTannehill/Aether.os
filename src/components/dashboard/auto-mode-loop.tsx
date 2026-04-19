"use client";

import { useEffect, useRef } from "react";
import type { AutoModePolicy, DashboardBrainPriorityTask } from "@/lib/brain";

type AutoModeLoopProps = {
  enabled: boolean;
  tasks: DashboardBrainPriorityTask[];
  policy: AutoModePolicy;
  intervalMs?: number;
  onTickStart?: () => void;
  onTickComplete?: (
    message: string,
    details?: {
      blocked?: Array<{
        id: string;
        title: string;
        reason: string;
      }>;
    }
  ) => void;
  onTickError?: (message: string) => void;
};

type AutoModeRunApiResponse = {
  ok: boolean;
  summary?: {
    received: number;
    executed: number;
    failed: number;
    skipped: number;
    blocked: number;
  };
  result?: {
    blocked?: Array<{
      id: string;
      title?: string;
      blocked_reason?: string;
    }>;
  };
  error?: string;
};

export default function AutoModeLoop({
  enabled,
  tasks,
  policy,
  intervalMs = 60000,
  onTickStart,
  onTickComplete,
  onTickError,
}: AutoModeLoopProps) {
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      runningRef.current = false;
      return;
    }

    let isCancelled = false;

    async function runTick() {
      if (runningRef.current || isCancelled) return;

      runningRef.current = true;
      onTickStart?.();

      try {
        const response = await fetch("/api/auto-mode/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tasks,
            limit: 5,
            policy,
          }),
        });

        const data = (await response.json()) as AutoModeRunApiResponse;

        if (!response.ok || !data.ok || !data.summary) {
          onTickError?.(data.error || "Auto Mode loop tick failed");
          return;
        }

        const blockedDetails =
          data.result?.blocked?.map((item) => ({
            id: item.id,
            title: item.title || "Untitled task",
            reason: item.blocked_reason || "Blocked by policy",
          })) ?? [];

        onTickComplete?.(
          `Loop tick → ${data.summary.executed} executed, ${data.summary.failed} failed, ${data.summary.skipped} skipped, ${data.summary.blocked} policy blocked`,
          {
            blocked: blockedDetails,
          }
        );
      } catch (err: any) {
        onTickError?.(err?.message || "Auto Mode loop tick failed");
      } finally {
        runningRef.current = false;
      }
    }
        runTick();

    const interval = window.setInterval(() => {
      runTick();
    }, intervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
      runningRef.current = false;
    };
  }, [enabled, tasks, policy, intervalMs, onTickStart, onTickComplete, onTickError]);

  return null;
}