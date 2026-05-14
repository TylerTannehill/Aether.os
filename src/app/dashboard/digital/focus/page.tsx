"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CircleDollarSign,
  MessageSquare,
  PenSquare,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

type FocusLaneItem = {
  id: string;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  type: "content" | "spend" | "reply";
  linkedAudience?: string;
  linkedGoal?: string;
  linkedNarrative?: string;
};

type ActiveContentExecution = {
  id: string;
  title: string;
  summary: string;
  platform: "Meta" | "Instagram" | "TikTok";
  owner: string;
  linkedAudience?: string;
  linkedGoal?: string;
  linkedNarrative?: string;
};

type ActiveSpendExecution = {
  id: string;
  title: string;
  summary: string;
  platform: "TikTok" | "Meta" | "X";
  currentShift: string;
  note: string;
  linkedAudience?: string;
  linkedGoal?: string;
  linkedNarrative?: string;
};

type ActiveReplyExecution = {
  id: string;
  title: string;
  summary: string;
  platform: "X" | "Instagram" | "Meta";
  threadName: string;
  suggestedTone: "Professional" | "Calm" | "Assertive";
  linkedAudience?: string;
  linkedGoal?: string;
  linkedNarrative?: string;
};

type ContentDrop = {
  id: string;
  title: string;
  platform: string;
  audience?: string;
  goal?: string;
  narrative?: string;
  createdAt: string;
};

type EngagementSpike = {
  id: string;
  platform: string;
  budgetShift: string;
  audience?: string;
  goal?: string;
  narrative?: string;
  createdAt: string;
};

type SentimentShift = {
  id: string;
  platform: string;
  tone: string;
  audience?: string;
  goal?: string;
  narrative?: string;
  createdAt: string;
};

function priorityTone(priority: FocusLaneItem["priority"]) {
  switch (priority) {
    case "high":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "low":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function typeTone(type: FocusLaneItem["type"]) {
  switch (type) {
    case "content":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "spend":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "reply":
    default:
      return "bg-purple-100 text-purple-700 border border-purple-200";
  }
}

export default function DigitalFocusModePage() {
  const [activeContent, setActiveContent] =
    useState<ActiveContentExecution | null>(null);
  const [activeSpend, setActiveSpend] =
    useState<ActiveSpendExecution | null>(null);
  const [activeReply, setActiveReply] =
    useState<ActiveReplyExecution | null>(null);

  const [contentConfirmed, setContentConfirmed] = useState<string | null>(null);
  const [spendConfirmed, setSpendConfirmed] = useState<string | null>(null);
  const [replyConfirmed, setReplyConfirmed] = useState<string | null>(null);

  const [contentPlatform, setContentPlatform] = useState("Meta");
  const [spendAdjustment, setSpendAdjustment] = useState("15%");
  const [replyTone, setReplyTone] = useState("Professional");

  const [contentDrops, setContentDrops] = useState<ContentDrop[]>([]);
  const [engagementSpikes, setEngagementSpikes] = useState<EngagementSpike[]>(
    []
  );
  const [sentimentShifts, setSentimentShifts] = useState<SentimentShift[]>([]);

  const [roleLoading, setRoleLoading] = useState(true);
  const [hasDigitalAccess, setHasDigitalAccess] = useState(false);
  const [hasDigitalDirector, setHasDigitalDirector] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRoleContext() {
      try {
        const response = await fetch("/api/admin/org-members");
        const data = await response.json();

        if (!mounted) return;

        const roles = Array.isArray(data?.roles) ? data.roles : [];
        const currentMember = data?.currentMember;
        const currentMemberId = currentMember?.id;

        const myRoles = currentMemberId
          ? roles.filter(
              (role: any) => role.organization_member_id === currentMemberId
            )
          : [];

        const baseRole = String(currentMember?.role || "").toLowerCase();
        const baseDepartment = String(
          currentMember?.department || ""
        ).toLowerCase();

        const isAdmin =
          baseRole === "admin" ||
          myRoles.some((role: any) => {
            const department = String(role.department || "").toLowerCase();
            const roleLevel = String(role.role_level || "").toLowerCase();
            return department === "admin" || roleLevel === "admin";
          });

        const hasDigitalRole =
          baseDepartment === "digital" ||
          myRoles.some(
            (role: any) => String(role.department || "").toLowerCase() === "digital"
          );

        const isDigitalDirector =
          isAdmin ||
          myRoles.some((role: any) => {
            const department = String(role.department || "").toLowerCase();
            const roleLevel = String(role.role_level || "").toLowerCase();
            return department === "digital" && roleLevel === "director";
          });

        setHasDigitalAccess(isAdmin || hasDigitalRole);
        setHasDigitalDirector(isDigitalDirector);
      } catch (error) {
        console.error("Failed to load digital role context:", error);
        if (!mounted) return;
        setHasDigitalAccess(false);
        setHasDigitalDirector(false);
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadRoleContext();

    return () => {
      mounted = false;
    };
  }, []);

  const nowLine = useMemo(() => {
    return {
      headline:
        "Stay in digital flow.",
      body:
        "Create content. Move spend into what’s working. Shape the conversation.",
    };
  }, []);

  const focusItems = useMemo<FocusLaneItem[]>(() => {
    return [];
  }, []);

  const grouped = useMemo(() => {
    return {
      content: focusItems.filter((item) => item.type === "content"),
      spend: focusItems.filter((item) => item.type === "spend"),
      reply: focusItems.filter((item) => item.type === "reply"),
    };
  }, [focusItems]);

  const activationSummary = useMemo(() => {
    return {
      contentDrops: contentDrops.length,
      engagementSpikes: engagementSpikes.length,
      sentimentShifts: sentimentShifts.length,
    };
  }, [contentDrops.length, engagementSpikes.length, sentimentShifts.length]);

  function openContentPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveContentExecution> = {
      "focus-1": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        platform: "Meta",
        owner: "Maya",
        linkedAudience: item.linkedAudience,
        linkedGoal: item.linkedGoal,
        linkedNarrative: item.linkedNarrative,
      },
      "focus-4": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        platform: "Instagram",
        owner: "Maya",
        linkedAudience: item.linkedAudience,
        linkedGoal: item.linkedGoal,
        linkedNarrative: item.linkedNarrative,
      },
    };

    const selected = mapped[item.id] ?? {
      id: item.id,
      title: item.title,
      summary: item.summary,
      platform: "Meta" as const,
      owner: "Assigned Owner",
      linkedAudience: item.linkedAudience,
      linkedGoal: item.linkedGoal,
      linkedNarrative: item.linkedNarrative,
    };

    setActiveContent(selected);
    setContentPlatform(selected.platform);
    setContentConfirmed(null);
  }

  function confirmContentAction() {
    if (!activeContent) return;

    const nextDrop: ContentDrop = {
      id: `content-drop-${Date.now()}`,
      title: activeContent.title,
      platform: contentPlatform,
      audience: activeContent.linkedAudience,
      goal: activeContent.linkedGoal,
      narrative: activeContent.linkedNarrative,
      createdAt: new Date().toLocaleString(),
    };

    setContentDrops((current) => [nextDrop, ...current]);
    setContentConfirmed(activeContent.id);
  }

  function clearContentPanel() {
    setActiveContent(null);
    setContentConfirmed(null);
  }

  function openSpendPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveSpendExecution> = {
      "focus-2": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        platform: "TikTok",
        currentShift: "15%",
        note: "Engagement and sentiment are strongest here right now.",
        linkedAudience: item.linkedAudience,
        linkedGoal: item.linkedGoal,
        linkedNarrative: item.linkedNarrative,
      },
      "focus-5": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        platform: "Meta",
        currentShift: "10%",
        note: "Underperforming spend should be tightened before refresh fatigue worsens.",
        linkedAudience: item.linkedAudience,
        linkedGoal: item.linkedGoal,
        linkedNarrative: item.linkedNarrative,
      },
    };

    const selected = mapped[item.id] ?? {
      id: item.id,
      title: item.title,
      summary: item.summary,
      platform: "Meta" as const,
      currentShift: "10%",
      note: "Reallocate budget toward the strongest current performer.",
      linkedAudience: item.linkedAudience,
      linkedGoal: item.linkedGoal,
      linkedNarrative: item.linkedNarrative,
    };

    setActiveSpend(selected);
    setSpendAdjustment(selected.currentShift);
    setSpendConfirmed(null);
  }

  function confirmSpendAction() {
    if (!activeSpend) return;
        const nextSpike: EngagementSpike = {
      id: `engagement-spike-${Date.now()}`,
      platform: activeSpend.platform,
      budgetShift: spendAdjustment,
      audience: activeSpend.linkedAudience,
      goal: activeSpend.linkedGoal,
      narrative: activeSpend.linkedNarrative,
      createdAt: new Date().toLocaleString(),
    };

    setEngagementSpikes((current) => [nextSpike, ...current]);
    setSpendConfirmed(activeSpend.id);
  }

  function clearSpendPanel() {
    setActiveSpend(null);
    setSpendConfirmed(null);
  }

  function openReplyPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveReplyExecution> = {
      "focus-3": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        platform: "X",
        threadName: "Negative public safety thread",
        suggestedTone: "Professional",
        linkedAudience: item.linkedAudience,
        linkedGoal: item.linkedGoal,
        linkedNarrative: item.linkedNarrative,
      },
      "focus-6": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        platform: "Instagram",
        threadName: "Top 6 visible comments",
        suggestedTone: "Calm",
        linkedAudience: item.linkedAudience,
        linkedGoal: item.linkedGoal,
        linkedNarrative: item.linkedNarrative,
      },
    };

    const selected = mapped[item.id] ?? {
      id: item.id,
      title: item.title,
      summary: item.summary,
      platform: "X" as const,
      threadName: "Active thread",
      suggestedTone: "Professional" as const,
      linkedAudience: item.linkedAudience,
      linkedGoal: item.linkedGoal,
      linkedNarrative: item.linkedNarrative,
    };

    setActiveReply(selected);
    setReplyTone(selected.suggestedTone);
    setReplyConfirmed(null);
  }

  function confirmReplyAction() {
    if (!activeReply) return;

    const nextShift: SentimentShift = {
      id: `sentiment-shift-${Date.now()}`,
      platform: activeReply.platform,
      tone: replyTone,
      audience: activeReply.linkedAudience,
      goal: activeReply.linkedGoal,
      narrative: activeReply.linkedNarrative,
      createdAt: new Date().toLocaleString(),
    };

    setSentimentShifts((current) => [nextShift, ...current]);
    setReplyConfirmed(activeReply.id);
  }

  function clearReplyPanel() {
    setActiveReply(null);
    setReplyConfirmed(null);
  }

  if (roleLoading) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading digital context...</p>
        </section>
      </div>
    );
  }

  if (!hasDigitalAccess) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Zap className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            No Digital Role Assigned
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            You are not currently assigned to Digital. Ask your campaign admin to add a Digital role if this work should be part of your operating lane.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Zap className="h-3.5 w-3.5" />
              Digital Focus Mode
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
              {hasDigitalDirector ? "Digital Director Access" : "Digital User Access"}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {nowLine.headline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {hasDigitalDirector ? nowLine.body : "Create content. Respond clearly. Keep the digital queue moving."}
              </p>
              
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/digital"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Digital
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      

      {(contentDrops.length > 0 ||
        engagementSpikes.length > 0 ||
        sentimentShifts.length > 0) && (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-800">
                Digital Activation
              </p>
              <h2 className="text-xl font-semibold text-indigo-950">
                Digital → Campaign output
              </h2>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-800">
              {activationSummary.contentDrops} content drop
              {activationSummary.contentDrops === 1 ? "" : "s"} •{" "}
              {activationSummary.engagementSpikes} spend move
              {activationSummary.engagementSpikes === 1 ? "" : "s"} •{" "}
              {activationSummary.sentimentShifts} sentiment shift
              {activationSummary.sentimentShifts === 1 ? "" : "s"}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Content Drops
              </p>
              <div className="mt-3 space-y-3">
                {contentDrops.length === 0 ? (
                  <p className="text-sm text-slate-500">No content outputs yet.</p>
                ) : (
                  contentDrops.map((drop) => (
                    <div key={drop.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{drop.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {drop.platform} • {drop.goal || "No goal"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Amplify what’s working
              </p>
              <div className="mt-3 space-y-3">
                {engagementSpikes.length === 0 ? (
                  <p className="text-sm text-slate-500">No spend moves yet.</p>
                ) : (
                  engagementSpikes.map((spike) => (
                    <div key={spike.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">
                        {spike.platform} · {spike.budgetShift}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {spike.goal || "No goal"} • {spike.audience || "No audience"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Sentiment Shifts
              </p>
              <div className="mt-3 space-y-3">
                {sentimentShifts.length === 0 ? (
                  <p className="text-sm text-slate-500">No response shifts yet.</p>
                ) : (
                  sentimentShifts.map((shift) => (
                    <div key={shift.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">
                        {shift.platform} · {shift.tone}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {shift.narrative || "No narrative"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="rounded-3xl border-2 border-sky-300 bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sky-700"></p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Content Lane · Create + Ship
              </h2>
            </div>
            <PenSquare className="h-6 w-6 text-sky-600" />
          </div>

          <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Digital Operating Pattern
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {hasDigitalDirector
                ? "Content creates momentum. Spend amplifies what works. Responses shape the conversation."
                : "Content creates momentum. Responses shape the conversation. Keep execution clean."}
            </p>
          </div>

          <div className="space-y-4">
            {grouped.content.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No live digital content actions are available yet.
              </div>
            ) : null}

            {grouped.content.map((item) => {
              const isActive = activeContent?.id === item.id;
              const isConfirmed = contentConfirmed === item.id;
              if (isActive && activeContent) {
                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-sky-300 bg-sky-50 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                      {isConfirmed && (
                        <span className="inline-flex rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                          created
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-lg font-semibold text-slate-900">
                      {activeContent.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activeContent.summary}
                    </p>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                      {activeContent.linkedAudience || "No audience"} •{" "}
                      {activeContent.linkedGoal || "No goal"} •{" "}
                      {activeContent.linkedNarrative || "No narrative"}
                    </div>

                    <div className="mt-4 rounded-2xl border border-sky-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-sky-700">
                        Content Panel
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Owner</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {activeContent.owner}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Platform
                          </label>
                          <select
                            value={contentPlatform}
                            onChange={(e) => setContentPlatform(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          >
                            <option>Meta</option>
                            <option>Instagram</option>
                            <option>TikTok</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={confirmContentAction}
                            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                          >
                            Create Content
                          </button>
                          <button
                            onClick={clearContentPanel}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        </div>

                        {isConfirmed && (
                          <p className="text-sm font-medium text-sky-700">
                            Content created for {contentPlatform}.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                        item.type
                      )}`}
                    >
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-4 text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.summary}</p>

                  <div className="mt-3 text-xs text-slate-500">
                    {item.linkedAudience || "No audience"} •{" "}
                    {item.linkedGoal || "No goal"} •{" "}
                    {item.linkedNarrative || "No narrative"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => openContentPanel(item)}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                    >
                      {item.id === "focus-1" ? "Open Creator" : "Finish Creative"}
                    </button>
                    <button
                      onClick={() => openContentPanel(item)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Review Content
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {hasDigitalDirector ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Secondary Lane</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Amplify what’s working
                </h2>
              </div>
              <CircleDollarSign className="h-5 w-5 text-emerald-700" />
            </div>

            <div className="space-y-4">
              {grouped.spend.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No live spend optimization actions are available yet.
                </div>
              ) : null}

              {grouped.spend.map((item) => {
                const isActive = activeSpend?.id === item.id;
                const isConfirmed = spendConfirmed === item.id;

                if (isActive && activeSpend) {
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        {isConfirmed && (
                          <span className="inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                            adjusted
                          </span>
                        )}
                      </div>

                      <p className="mt-3 font-semibold text-slate-900">
                        {activeSpend.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {activeSpend.summary}
                      </p>

                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                        {activeSpend.linkedAudience || "No audience"} •{" "}
                        {activeSpend.linkedGoal || "No goal"} •{" "}
                        {activeSpend.linkedNarrative || "No narrative"}
                      </div>

                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">
                          Spend Panel
                        </p>

                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Platform</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {activeSpend.platform}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-900">Why</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {activeSpend.note}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-900">
                              Budget Shift
                            </label>
                            <select
                              value={spendAdjustment}
                              onChange={(e) => setSpendAdjustment(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                            >
                              <option>10%</option>
                              <option>15%</option>
                              <option>20%</option>
                              <option>25%</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={confirmSpendAction}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                            >
                              Confirm Shift
                            </button>
                            <button
                              onClick={clearSpendPanel}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Clear
                            </button>
                          </div>

                          {isConfirmed && (
                            <p className="text-sm font-medium text-emerald-700">
                              Spend shift confirmed: {spendAdjustment} to {activeSpend.platform}.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.summary}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openSpendPanel(item)}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                      >
                        Open Spend Panel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          ) : null}

          <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Tertiary Lane</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Shape the conversation
                </h2>
              </div>
              <MessageSquare className="h-5 w-5 text-purple-700" />
            </div>

            <div className="space-y-4">
              {grouped.reply.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No live sentiment or reply actions are available yet.
                </div>
              ) : null}

              {grouped.reply.map((item) => {
                const isActive = activeReply?.id === item.id;
                const isConfirmed = replyConfirmed === item.id;

                if (isActive && activeReply) {
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-purple-300 bg-purple-50 p-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        {isConfirmed && (
                          <span className="inline-flex rounded-full border border-purple-300 bg-white px-3 py-1 text-xs font-semibold text-purple-700">
                            queued
                          </span>
                        )}
                      </div>

                      <p className="mt-3 font-semibold text-slate-900">
                        {activeReply.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {activeReply.summary}
                      </p>

                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                        {activeReply.linkedAudience || "No audience"} •{" "}
                        {activeReply.linkedGoal || "No goal"} •{" "}
                        {activeReply.linkedNarrative || "No narrative"}
                      </div>

                      <div className="mt-4 rounded-2xl border border-purple-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-wide text-purple-700">
                          Reply Panel
                        </p>

                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Thread</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {activeReply.threadName}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-900">
                              Tone
                            </label>
                            <select
                              value={replyTone}
                              onChange={(e) => setReplyTone(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                            >
                              <option>Professional</option>
                              <option>Calm</option>
                              <option>Assertive</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={confirmReplyAction}
                              className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700"
                            >
                              Queue Reply
                            </button>
                            <button
                              onClick={clearReplyPanel}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Clear
                            </button>
                          </div>

                          {isConfirmed && (
                            <p className="text-sm font-medium text-purple-700">
                              Reply queued with {replyTone} tone.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-purple-50/50 p-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeTone(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.summary}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openReplyPanel(item)}
                        className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700"
                      >
                        Open Reply Panel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

<section
        className={`grid gap-3 ${
          hasDigitalDirector ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <div
          className={`rounded-3xl border p-4 shadow-sm ${
            grouped.content.length > 0
              ? "border-rose-200 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-sm font-medium ${
                grouped.content.length > 0 ? "text-rose-800" : "text-slate-700"
              }`}
            >
              Content Priority
            </p>
            <PenSquare
              className={`h-5 w-5 ${
                grouped.content.length > 0 ? "text-rose-700" : "text-slate-500"
              }`}
            />
          </div>
          <p
            className={`mt-3 text-2xl font-semibold ${
              grouped.content.length > 0 ? "text-rose-900" : "text-slate-900"
            }`}
          >
            {grouped.content.length}
          </p>
          <p
            className={`mt-2 text-sm ${
              grouped.content.length > 0 ? "text-rose-800" : "text-slate-600"
            }`}
          >
            Content tasks requiring focused execution
          </p>
        </div>

        {hasDigitalDirector ? (
          <div
            className={`rounded-3xl border p-4 shadow-sm ${
              grouped.spend.length > 0
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-medium ${
                  grouped.spend.length > 0
                    ? "text-emerald-800"
                    : "text-slate-700"
                }`}
              >
                Amplify what’s working
              </p>
              <CircleDollarSign
                className={`h-5 w-5 ${
                  grouped.spend.length > 0
                    ? "text-emerald-700"
                    : "text-slate-500"
                }`}
              />
            </div>
            <p
              className={`mt-3 text-2xl font-semibold ${
                grouped.spend.length > 0
                  ? "text-emerald-900"
                  : "text-slate-900"
              }`}
            >
              {grouped.spend.length}
            </p>
            <p
              className={`mt-2 text-sm ${
                grouped.spend.length > 0
                  ? "text-emerald-800"
                  : "text-slate-600"
              }`}
            >
              Budget shifts and allocation decisions
            </p>
          </div>
        ) : null}

        <div
          className={`rounded-3xl border p-4 shadow-sm ${
            grouped.reply.length > 0
              ? "border-rose-200 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-sm font-medium ${
                grouped.reply.length > 0 ? "text-rose-800" : "text-slate-700"
              }`}
            >
              Shape the conversation
            </p>
            <MessageSquare
              className={`h-5 w-5 ${
                grouped.reply.length > 0 ? "text-rose-700" : "text-slate-500"
              }`}
            />
          </div>
          <p
            className={`mt-3 text-2xl font-semibold ${
              grouped.reply.length > 0 ? "text-rose-900" : "text-slate-900"
            }`}
          >
            {grouped.reply.length}
          </p>
          <p
            className={`mt-2 text-sm ${
              grouped.reply.length > 0 ? "text-rose-800" : "text-slate-600"
            }`}
          >
            Responses and comment handling items
          </p>
        </div>
      </section>

      <section className="hidden" aria-hidden="true">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Digital Operating Pattern
            </h2>
            <p className="mt-2 text-sm font-medium text-amber-900">
              Content creates momentum. Spend amplifies what works. Responses shape the conversation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}