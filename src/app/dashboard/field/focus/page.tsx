"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  ListChecks,
  MapPinned,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { getLists } from "@/lib/data/lists";
import { CampaignList } from "@/lib/data/types";

type FocusLaneItem = {
  id: string;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  type: "turf" | "canvass" | "follow_up";
  linkedListId?: string;
  linkedListName?: string;
};

type ActiveTurfExecution = {
  id: string;
  title: string;
  summary: string;
  owner: string;
  completion: number;
  region: string;
  linkedListId?: string;
  linkedListName?: string;
};

type FollowUpGeneratedList = {
  id: string;
  name: string;
  source: string;
  created: string;
};

function resolveFieldListType(list: CampaignList): FocusLaneItem["type"] | null {
  const name = (list.name || "").toLowerCase();

  if (
    name.includes("turf") ||
    name.includes("door") ||
    name.includes("walk") ||
    name.includes("canvass") ||
    name.includes("field")
  ) {
    if (
      name.includes("follow") ||
      name.includes("callback") ||
      name.includes("engaged") ||
      name.includes("conversation")
    ) {
      return "follow_up";
    }

    if (
      name.includes("packet") ||
      name.includes("canvass") ||
      name.includes("operator") ||
      name.includes("volunteer")
    ) {
      return "canvass";
    }

    return "turf";
  }

  if (
    name.includes("follow") ||
    name.includes("callback") ||
    name.includes("conversation")
  ) {
    return "follow_up";
  }

  return null;
}

function buildFieldFocusItemFromList(
  list: CampaignList,
  index: number
): FocusLaneItem | null {
  const type = resolveFieldListType(list);

  if (!type) return null;

  const hasOwner = Boolean(list.default_owner_name?.trim());
  const priority: FocusLaneItem["priority"] = !hasOwner
    ? "high"
    : index <= 1
      ? "high"
      : "medium";

  if (type === "turf") {
    return {
      id: `field-list-${list.id}`,
      title: `Finish ${list.name}`,
      summary: hasOwner
        ? `${list.name} is a field routing list assigned to ${list.default_owner_name}. Keep coverage moving and prevent turf completion from dragging.`
        : `${list.name} is a field routing list without a default owner. Assign coverage and move it before it becomes execution drift.`,
      priority,
      type,
      linkedListId: list.id,
      linkedListName: list.name,
    };
  }

  if (type === "canvass") {
    return {
      id: `field-list-${list.id}`,
      title: `Route operators into ${list.name}`,
      summary: hasOwner
        ? `${list.name} has routing context. Use it to align the strongest field operators with the highest-value packet.`
        : `${list.name} needs operator routing before execution can move cleanly.`,
      priority,
      type,
      linkedListId: list.id,
      linkedListName: list.name,
    };
  }

  return {
    id: `field-list-${list.id}`,
    title: `Convert conversations from ${list.name}`,
    summary: hasOwner
      ? `${list.name} should move into follow-up so strong field conversations do not sit idle.`
      : `${list.name} has follow-up value but needs routing before Outreach can absorb it cleanly.`,
    priority,
    type,
    linkedListId: list.id,
    linkedListName: list.name,
  };
}

function priorityRank(priority: FocusLaneItem["priority"]) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

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
    case "turf":
      return "bg-sky-100 text-sky-700 border border-sky-200";
    case "canvass":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "follow_up":
    default:
      return "bg-purple-100 text-purple-700 border border-purple-200";
  }
}

export default function FieldFocusModePage() {
  const [activeTurf, setActiveTurf] = useState<ActiveTurfExecution | null>(null);
  const [activeCanvass, setActiveCanvass] = useState<string | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<string>("Highest-ID Packet");
  const [followUpAction, setFollowUpAction] = useState<string>("Create Follow-Up Tasks");
  const [assignmentConfirmed, setAssignmentConfirmed] = useState<string | null>(null);
  const [followUpConfirmed, setFollowUpConfirmed] = useState<string | null>(null);
  const [completedLaneActions, setCompletedLaneActions] = useState(0);
  const [generatedLists, setGeneratedLists] = useState<FollowUpGeneratedList[]>([]);
  const [fieldLists, setFieldLists] = useState<CampaignList[]>([]);
  const [loadingFieldLists, setLoadingFieldLists] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [hasFieldAccess, setHasFieldAccess] = useState(false);
  const [hasFieldDirector, setHasFieldDirector] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFieldLists() {
      try {
        const lists = await getLists();

        if (!mounted) return;

        setFieldLists(lists);
      } catch (error) {
        console.error("Failed to load field routing lists:", error);

        if (!mounted) return;

        setFieldLists([]);
      } finally {
        if (mounted) {
          setLoadingFieldLists(false);
        }
      }
    }

    loadFieldLists();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRoleContext() {
      try {
        const response = await fetch("/api/admin/org-members");
        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          console.error("Failed to load field role context:", data?.error);
          setHasFieldAccess(false);
          setHasFieldDirector(false);
          return;
        }

        const currentMember = data?.currentMember;
        const roles = Array.isArray(data?.roles) ? data.roles : [];

        const currentMemberRoles = roles.filter(
          (role: any) => role.organization_member_id === currentMember?.id
        );

        const hasAdminRole =
          currentMember?.role === "admin" ||
          currentMemberRoles.some(
            (role: any) =>
              role.department === "admin" || role.role_level === "admin"
          );

        const fieldRoles = currentMemberRoles.filter(
          (role: any) => role.department === "field"
        );

        const hasFieldRole = fieldRoles.length > 0;
        const fieldDirector = fieldRoles.some(
          (role: any) => role.role_level === "director"
        );

        setHasFieldAccess(hasAdminRole || hasFieldRole);
        setHasFieldDirector(hasAdminRole || fieldDirector);
      } catch (error) {
        console.error("Failed to load field role context:", error);
        if (!mounted) return;
        setHasFieldAccess(false);
        setHasFieldDirector(false);
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
        "Stay in field flow.",
      body:
        "Finish coverage. Support your strongest operators. Convert the best conversations.",
    };
  }, []);

  const fallbackFocusItems = useMemo<FocusLaneItem[]>(() => {
    return [];
  }, []);

  const generatedFieldFocusItems = useMemo<FocusLaneItem[]>(() => {
    return fieldLists
      .map((list, index) => buildFieldFocusItemFromList(list, index))
      .filter((item): item is FocusLaneItem => Boolean(item))
      .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
      .slice(0, 6);
  }, [fieldLists]);

  const focusItems = useMemo<FocusLaneItem[]>(() => {
    return generatedFieldFocusItems;
  }, [generatedFieldFocusItems]);

  const grouped = useMemo(() => {
    return {
      turf: focusItems.filter((item) => item.type === "turf"),
      canvass: focusItems.filter((item) => item.type === "canvass"),
      follow_up: focusItems.filter((item) => item.type === "follow_up"),
    };
  }, [focusItems]);

  const linkedListPressure = useMemo(() => {
    return {
      turfLists: grouped.turf.length,
      canvassLists: grouped.canvass.length,
      followUpLists: grouped.follow_up.length,
      generatedCount: generatedLists.length,
    };
  }, [grouped, generatedLists.length]);

  function startTurf(item: FocusLaneItem) {
    const mappedTurf: Record<string, ActiveTurfExecution> = {
      "focus-1": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        owner: "Avery",
        completion: 39,
        region: "Chicago",
        linkedListId: item.linkedListId,
        linkedListName: item.linkedListName,
      },
      "focus-4": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        owner: "Jordan",
        completion: 58,
        region: "Naperville",
        linkedListId: item.linkedListId,
        linkedListName: item.linkedListName,
      },
    };

    setActiveTurf(
      mappedTurf[item.id] ?? {
        id: item.id,
        title: item.title,
        summary: item.summary,
        owner: "Assigned Operator",
        completion: 50,
        region: "Active Turf",
        linkedListId: item.linkedListId,
        linkedListName: item.linkedListName,
      }
    );
  }

  function markTurfInProgress() {
    if (!activeTurf) return;

    setActiveTurf((current) => {
      if (!current) return current;

      return {
        ...current,
        completion:
          current.completion >= 95 ? current.completion : current.completion + 5,
      };
    });
  }

  function markTurfComplete() {
    if (!activeTurf) return;

    setCompletedLaneActions((value) => value + 1);
    setActiveTurf((current) => {
      if (!current) return current;

      return {
        ...current,
        completion: 100,
      };
    });
  }

  function clearActiveTurf() {
    setActiveTurf(null);
  }

  function openCanvassPanel(itemId: string) {
    setActiveCanvass(itemId);
    setAssignmentConfirmed(null);

    if (itemId === "focus-2") {
      setSelectedPacket("Highest-ID Packet");
    } else {
      setSelectedPacket("South Persuasion Support Turf");
    }
  }

  function confirmCanvassAssignment() {
    if (!activeCanvass) return;
    setAssignmentConfirmed(activeCanvass);
    setCompletedLaneActions((value) => value + 1);
  }

  function clearCanvassPanel() {
    setActiveCanvass(null);
    setAssignmentConfirmed(null);
  }

  function openFollowUpPanel(itemId: string) {
    setActiveFollowUp(itemId);
    setFollowUpConfirmed(null);

    if (itemId === "focus-3") {
      setFollowUpAction("Create Follow-Up Tasks");
    } else {
      setFollowUpAction("Queue 10 Callbacks");
    }
  }

  function confirmFollowUpAction() {
    if (!activeFollowUp) return;

    const sourceItem = focusItems.find((item) => item.id === activeFollowUp);
    const listBaseName =
      followUpAction === "Create Follow-Up Tasks"
        ? "Field Engaged Follow-Up"
        : followUpAction === "Queue 10 Callbacks"
          ? "Field Callback Queue"
          : followUpAction === "Build Call List"
            ? "Field Call List"
            : "Field Immediate Outreach";

    const nextList: FollowUpGeneratedList = {
      id: `generated-${Date.now()}`,
      name: `${listBaseName} ${generatedLists.length + 1}`,
      source: sourceItem?.title || "Field follow-up lane",
      created: new Date().toLocaleString(),
    };

    setGeneratedLists((current) => [nextList, ...current]);
    setFollowUpConfirmed(activeFollowUp);
    setCompletedLaneActions((value) => value + 1);
  }

  function clearFollowUpPanel() {
    setActiveFollowUp(null);
    setFollowUpConfirmed(null);
  }

  if (roleLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading field context...</p>
        </div>
      </div>
    );
  }

  if (!hasFieldAccess) {
    return (
      <div className="space-y-6 p-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <MapPinned className="h-5 w-5 text-slate-500" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            No Field Role Assigned
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            You are not currently assigned to Field. Ask an admin to add a Field
            Director or Field User role before working this focus lane.
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
      {activeTurf && (
        <section className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 shadow-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                <Zap className="h-3.5 w-3.5" />
                Active Turf Execution
              </div>

              <div>
                <h2 className="text-xl font-semibold text-emerald-950">
                  {activeTurf.title}
                </h2>
                <p className="mt-1 text-sm text-emerald-900">
                  {activeTurf.region} • Owner: {activeTurf.owner}
                </p>
              </div>

              <p className="max-w-3xl text-sm text-emerald-900">
                {activeTurf.summary}
              </p>

              {activeTurf.linkedListName ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                  <ListChecks className="h-3.5 w-3.5" />
                  Working list: {activeTurf.linkedListName}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">
                  Completion
                </p>
                <p className="mt-2 text-xl font-semibold text-emerald-950">
                  {activeTurf.completion}%
                </p>
              </div>
                            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">
                  Linked Routing
                </p>
                <p className="mt-2 text-sm font-medium text-emerald-950">
                  {activeTurf.linkedListName || "No linked list"}
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Turf execution should stay tied to a usable list container.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-700">
                  Execution
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={markTurfInProgress}
                    className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={markTurfComplete}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={clearActiveTurf}
                    className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Zap className="h-3.5 w-3.5" />
              Field Focus Mode
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              {hasFieldDirector ? "Field Director Access" : "Field User Access"}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {nowLine.headline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {nowLine.body}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/field"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Field
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      

      {generatedLists.length > 0 ? (
        <section className="rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">
                Generated Follow-Up Lists
              </p>
              <h2 className="text-xl font-semibold text-purple-950">
                Field → Outreach Routing
              </h2>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-800">
              {linkedListPressure.generatedCount} generated
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {generatedLists.map((list) => (
              <div
                key={list.id}
                className="rounded-2xl border border-purple-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{list.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{list.source}</p>
                  </div>

                  <span className="inline-flex rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    field_follow_up
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Created: {list.created}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/lists"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Open Lists
                  </Link>
                  <Link
                    href="/dashboard/outreach"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Open Outreach
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr_0.9fr]">
        <div className="rounded-3xl border-2 border-sky-300 bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sky-700">Turf Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Finish active turf
              </h2>
            </div>
            <MapPinned className="h-5 w-5 text-sky-600" />
          </div>

          <div className="space-y-4">
            {grouped.turf.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {loadingFieldLists
                  ? "Loading field turf actions..."
                  : "No turf focus actions are available from live field lists yet."}
              </div>
            ) : null}

            {grouped.turf.map((item) => {
              const isActive = activeTurf?.id === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
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
                    {isActive && (
                      <span className="inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                        active
                      </span>
                    )}
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.summary}</p>

                  {item.linkedListName ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Linked list: {item.linkedListName}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => startTurf(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Start Turf
                    </button>
                    <button
                      onClick={markTurfInProgress}
                      disabled={!isActive}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={markTurfComplete}
                      disabled={!isActive}
                      className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {hasFieldDirector ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Canvass Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Support strongest operators
              </h2>
            </div>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {grouped.canvass.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {loadingFieldLists
                  ? "Loading canvass actions..."
                  : "No canvass focus actions are available from live field lists yet."}
              </div>
            ) : null}

            {grouped.canvass.map((item) => {
              const isActive = activeCanvass === item.id;
              const isConfirmed = assignmentConfirmed === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
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
                        assigned
                      </span>
                    )}
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.summary}</p>

                  {item.linkedListName ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Routing packet: {item.linkedListName}
                    </p>
                  ) : null}

                  {!isActive ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openCanvassPanel(item.id)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        {item.id === "focus-2" ? "Reassign Tyler" : "Create Pairing"}
                      </button>
                      <button
                        onClick={() => openCanvassPanel(item.id)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {item.id === "focus-2" ? "View Packet" : "Assign Support"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">
                        Assignment Panel
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Operator
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.id === "focus-2" ? "Tyler" : "Top Canvasser + New Volunteer"}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Target Packet / Turf
                          </label>
                          <select
                            value={selectedPacket}
                            onChange={(e) => setSelectedPacket(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          >
                            <option>Highest-ID Packet</option>
                            <option>South Persuasion Support Turf</option>
                            <option>Central Walk Packet</option>
                            <option>North Aurora East</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={confirmCanvassAssignment}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                          >
                            Confirm Assignment
                          </button>
                          <button
                            onClick={clearCanvassPanel}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        </div>

                        {isConfirmed && (
                          <p className="text-sm font-medium text-emerald-700">
                            Assignment confirmed to {selectedPacket}.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        ) : null}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Follow-Up Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Convert strong conversations
              </h2>
            </div>
            <ClipboardList className="h-5 w-5 text-purple-600" />
          </div>

          <div className="space-y-4">
            {grouped.follow_up.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {loadingFieldLists
                  ? "Loading field follow-up actions..."
                  : "No field follow-up actions are available from live field lists yet."}
              </div>
            ) : null}

            {grouped.follow_up.map((item) => {
              const isActive = activeFollowUp === item.id;
              const isConfirmed = followUpConfirmed === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    isActive
                      ? "border-purple-300 bg-purple-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
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

                  <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.summary}</p>

                  {item.linkedListName ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Destination list: {item.linkedListName}
                    </p>
                  ) : null}

                  {!isActive ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openFollowUpPanel(item.id)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        {item.id === "focus-3" ? "Generate List" : "Queue Callbacks"}
                      </button>
                      <button
                        onClick={() => openFollowUpPanel(item.id)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {item.id === "focus-3" ? "View Conversations" : "Start Calling"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-purple-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-purple-700">
                        Follow-Up Panel
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Detected Opportunity
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.id === "focus-3"
                              ? "8 recent engaged conversations ready for task creation."
                              : "10 high-quality callbacks ready to queue immediately."}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Execution Action
                          </label>
                          <select
                            value={followUpAction}
                            onChange={(e) => setFollowUpAction(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          >
                            <option>Create Follow-Up Tasks</option>
                            <option>Queue 10 Callbacks</option>
                            <option>Build Call List</option>
                            <option>Start Immediate Outreach</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={confirmFollowUpAction}
                            className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-700"
                          >
                            Confirm Action
                          </button>
                          <button
                            onClick={clearFollowUpPanel}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        </div>

                        {isConfirmed && (
                          <p className="text-sm font-medium text-purple-700">
                            Follow-up action confirmed: {followUpAction}.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

<section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-sky-800">Turf Priority</p>
            <MapPinned className="h-5 w-5 text-sky-700" />
          </div>
          <p className="mt-3 text-xl font-semibold text-sky-900">
            {grouped.turf.length}
          </p>
          <p className="mt-2 text-sm text-sky-800">
            Turf tasks requiring immediate execution
          </p>
        </div>

        {hasFieldDirector ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-emerald-800">
                Canvasser Moves
              </p>
              <Users className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-3 text-xl font-semibold text-emerald-900">
              {grouped.canvass.length}
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Allocation and execution changes
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-800">
              Follow-Up Queue
            </p>
            <ClipboardList className="h-5 w-5 text-purple-700" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-purple-900">
            {grouped.follow_up.length}
          </p>
          <p className="mt-2 text-sm text-purple-800">
            Conversation-driven follow-up actions
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">
              Actions Saved
            </p>
            <ListChecks className="h-5 w-5 text-amber-700" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-amber-900">
            {completedLaneActions}
          </p>
          <p className="mt-2 text-sm text-amber-800">
            Confirmed field actions this session
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Field Operating Pattern
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              {hasFieldDirector
                ? "This page should stay ruthless: finish turf first, move strongest canvassers second, and convert the best conversations into follow-up third. Everything else in Field should support those actions, not distract from them."
                : "This page should stay ruthless: finish turf first and convert the best conversations into follow-up. Assignment and operator routing stay with Field Director access."} {loadingFieldLists
                ? "Loading live routing lists."
                : generatedFieldFocusItems.length > 0
                  ? "Live list routing is currently driving this focus queue."
                  : "No live field routing lists are available yet."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}