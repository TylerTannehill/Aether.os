"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Loader2,
  Users,
  Zap,
} from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardData } from "@/lib/data/types";
import { useDashboardOwner } from "../owner-context";
import { useFocusContext } from "@/lib/focus/focus-context";
import { buildActionEngineAdapterResult } from "@/lib/priority/action-engine-adapter";
import { getActionEnginePageData } from "@/lib/priority/action-engine-selectors";
import { ActionItem } from "@/lib/priority/action-engine";
import {
  ExecuteActionResult,
  buildExecuteRequestFromAction,
  dryRunActionItem,
  executeActionItem,
} from "@/lib/priority/action-execution-client";
import { buildDashboardBrainOutput } from "@/lib/brain";

function isFallbackTask(taskType?: string | null) {
  return (taskType || "").trim().toLowerCase() === "fallback";
}

function normalizeTaskStatus(status?: string | null) {
  const value = (status || "").trim().toLowerCase();

  if (["done", "completed", "complete"].includes(value)) {
    return "completed";
  }

  if (["in_progress", "in progress", "active"].includes(value)) {
    return "in_progress";
  }

  return value || "open";
}

function formatPriorityTone(level?: string | null) {
  switch ((level || "").toLowerCase()) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatBucketTone(bucket?: string | null) {
  switch ((bucket || "").toLowerCase()) {
    case "fix_now":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "follow_up":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "routing":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "owner":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "pipeline":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

type DashboardTask = DashboardData["tasks"][number] & {
  fallback_reason?: string | null;
};

type BucketKey =
  | "immediate"
  | "fixNow"
  | "followUp"
  | "routing"
  | "owner"
  | "pipeline";

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

type OrgMemberRole = {
  id?: string;
  organization_member_id: string;
  organization_id?: string;
  department: string;
  role_level: string;
  is_primary?: boolean;
};

type OrgMemberRecord = {
  id: string;
  user_id?: string;
  role?: string | null;
  department?: string | null;
  title?: string | null;
  organization_id?: string | null;
};

function normalizeRoleValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

type StrategicPushType = "momentum" | "pressure" | "stabilization";

type StrategicPush = {
  id: string;
  title: string;
  type: StrategicPushType;
  bucket: BucketKey;
  lanes: DemoDepartment[];
  trigger: string;
  objective: string;
  actions: string[];
};

function getStrategicPushTone(type: StrategicPushType) {
  switch (type) {
    case "momentum":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "pressure":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "stabilization":
    default:
      return "border-sky-200 bg-sky-50 text-sky-800";
  }
}

function pushMatchesAction(push: StrategicPush, action: any) {
  const itemDepartment = getFocusItemDepartment(action);
  const itemBucket = String(action?.bucket ?? "immediate").replace("_", "");

  const bucketMatch =
    push.bucket === "immediate"
      ? itemBucket === "immediate"
      : push.bucket === "fixNow"
      ? itemBucket in {"fixnow": 1}
      : push.bucket === "followUp"
      ? itemBucket in {"followup": 1}
      : push.bucket === "routing"
      ? itemBucket in {"routing": 1}
      : push.bucket === "owner"
      ? itemBucket in {"owner": 1}
      : itemBucket in {"pipeline": 1};

  const laneMatch =
    itemDepartment === "system" || push.lanes.includes(itemDepartment);

  return bucketMatch && laneMatch;
}

function getActionReasonLines(action: any): string[] {
  if (Array.isArray(action?.brain_reasons) && action.brain_reasons.length) {
    return action.brain_reasons
      .filter((reason: unknown): reason is string => typeof reason === "string")
      .slice(0, 3);
  }

  if (Array.isArray(action?.badges) && action.badges.length) {
    return action.badges
      .filter((badge: unknown): badge is string => typeof badge === "string")
      .slice(0, 3);
  }

  if (
    typeof action?.recommendedAction === "string" &&
    action.recommendedAction
  ) {
    return [action.recommendedAction];
  }

  if (typeof action?.summary === "string" && action.summary) {
    return [action.summary];
  }

  return ["No explicit reasoning available yet."];
}

function getFocusItemDepartment(item: any): DemoDepartment | "system" {
  const text = `${item?.department ?? ""} ${item?.domain ?? ""} ${
    item?.title ?? ""
  } ${item?.summary ?? ""} ${item?.recommendedAction ?? ""}`.toLowerCase();

  if (
    text.includes("finance") ||
    text.includes("donor") ||
    text.includes("pledge")
  ) {
    return "finance";
  }

  if (
    text.includes("field") ||
    text.includes("turf") ||
    text.includes("canvass") ||
    text.includes("door")
  ) {
    return "field";
  }

  if (
    text.includes("digital") ||
    text.includes("content") ||
    text.includes("sentiment") ||
    text.includes("platform")
  ) {
    return "digital";
  }

  if (
    text.includes("print") ||
    text.includes("mailer") ||
    text.includes("mail") ||
    text.includes("asset") ||
    text.includes("delivery")
  ) {
    return "print";
  }

  if (
    text.includes("outreach") ||
    text.includes("follow-up") ||
    text.includes("follow up") ||
    text.includes("contact") ||
    text.includes("call")
  ) {
    return "outreach";
  }

  return "system";
}

function getRoleQueueLimit(role: DemoRole, bucket: BucketKey) {
  if (role === "admin") {
    return bucket === "immediate" ? 6 : 5;
  }

  if (role === "director") {
    return bucket === "immediate" ? 4 : 3;
  }

  return bucket === "immediate" ? 3 : 2;
}

function getFocusRoleLabel(role: DemoRole) {
  if (role === "admin") return "Admin Focus";
  if (role === "director") return "Director Focus";
  return "Operator Focus";
}

function getFocusDepartmentLabel(department: DemoDepartment) {
  switch (department) {
    case "finance":
      return "Finance";
    case "field":
      return "Field";
    case "digital":
      return "Digital";
    case "print":
      return "Print";
    case "outreach":
    default:
      return "Outreach";
  }
}

export default function FocusModePage() {
  const [contacts, setContacts] = useState<DashboardData["contacts"]>([]);
  const [lists, setLists] = useState<DashboardData["lists"]>([]);
  const [logs, setLogs] = useState<DashboardData["logs"]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeBucket, setActiveBucket] = useState<BucketKey>("immediate");
  const [executingActionId, setExecutingActionId] = useState<string | null>(
    null
  );
  const [previewingActionId, setPreviewingActionId] = useState<string | null>(
    null
  );
  const [lastExecution, setLastExecution] =
    useState<ExecuteActionResult | null>(null);
  const [demoRole, setDemoRole] = useState<DemoRole>("admin");
  const [demoDepartment, setDemoDepartment] =
    useState<DemoDepartment>("outreach");
  const [activePushId, setActivePushId] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [dashboardFocusAccess, setDashboardFocusAccess] = useState(false);
  const [dashboardFocusRoleLabel, setDashboardFocusRoleLabel] = useState(
    "Campaign leadership"
  );
  const [assignedDepartmentRoutes, setAssignedDepartmentRoutes] = useState<
    DemoDepartment[]
  >([]);

  const { ownerFilter, applyMyDashboard } = useDashboardOwner();
  const { focusContext, clearFocusContext } = useFocusContext();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDashboardFocusAccess();
  }, []);

  useEffect(() => {
    if (!focusContext?.bucket) return;

    setActiveBucket(focusContext.bucket);
    clearFocusContext();
  }, [focusContext, clearFocusContext]);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const data = await getDashboardData();
      setContacts(data.contacts ?? []);
      setLists(data.lists ?? []);
      setLogs(data.logs ?? []);
      setTasks((data.tasks as DashboardTask[]) ?? []);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load focus mode");
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardFocusAccess() {
    try {
      setRoleLoading(true);

      const response = await fetch("/api/admin/org-members", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load role context");
      }

      const currentMember = data?.currentMember as OrgMemberRecord | undefined;
      const roles = Array.isArray(data?.roles)
        ? (data.roles as OrgMemberRole[])
        : [];

      const currentMemberId = currentMember?.id || "";
      const myRoles = roles.filter(
        (role) => role.organization_member_id === currentMemberId
      );

      const baseRole = normalizeRoleValue(currentMember?.role);
      const baseDepartment = normalizeRoleValue(currentMember?.department);
      const baseTitle = normalizeRoleValue(currentMember?.title);

      const roleValues = myRoles.map((role) =>
        normalizeRoleValue(role.role_level)
      );
      const departmentValues = myRoles.map((role) =>
        normalizeRoleValue(role.department)
      );

      const hasAdminAccess =
        baseRole === "admin" ||
        baseDepartment === "admin" ||
        roleValues.includes("admin") ||
        departmentValues.includes("admin");

      const hasCampaignManagerAccess =
        baseRole === "campaign_manager" ||
        baseTitle.includes("campaign_manager") ||
        baseTitle === "cm" ||
        roleValues.includes("campaign_manager") ||
        roleValues.includes("cm") ||
        myRoles.some((role) => {
          const department = normalizeRoleValue(role.department);
          const level = normalizeRoleValue(role.role_level);
          return (
            department === "campaign" &&
            ["manager", "campaign_manager", "director", "admin"].includes(
              level
            )
          );
        });

      const nextAssignedDepartments = Array.from(
        new Set(
          myRoles
            .map((role) => normalizeRoleValue(role.department))
            .filter((department): department is DemoDepartment =>
              ["outreach", "finance", "field", "digital", "print"].includes(
                department
              )
            )
        )
      );

      setAssignedDepartmentRoutes(nextAssignedDepartments);
      setDashboardFocusAccess(hasAdminAccess || hasCampaignManagerAccess);

      if (hasAdminAccess) {
        setDashboardFocusRoleLabel("Admin / Campaign Manager Focus");
        setDemoRole("admin");
      } else if (hasCampaignManagerAccess) {
        setDashboardFocusRoleLabel("Campaign Manager Focus");
        setDemoRole("admin");
      } else if (nextAssignedDepartments[0]) {
        setDemoDepartment(nextAssignedDepartments[0]);
        setDemoRole("general_user");
        setDashboardFocusRoleLabel("Department Focus Required");
      }
    } catch (err: any) {
      setDashboardFocusAccess(false);
      setMessage(err?.message || "Failed to load dashboard focus access");
    } finally {
      setRoleLoading(false);
    }
  }

  const rawData = useMemo<DashboardData>(() => {
    return {
      contacts,
      lists,
      logs,
      tasks,
    };
  }, [contacts, lists, logs, tasks]);

  const filteredData = useMemo(() => {
    if (!ownerFilter) {
      return rawData;
    }

    const normalizedOwner = String(ownerFilter).toLowerCase();

    return {
      contacts: rawData.contacts.filter((contact: any) => {
        const owner =
          contact.owner_id ??
          contact.assigned_to ??
          contact.owner ??
          contact.owner_name;

        return String(owner || "").toLowerCase() === normalizedOwner;
      }),
      lists: rawData.lists,
      logs: rawData.logs.filter((log: any) => {
        const owner =
          log.owner_id ??
          log.assigned_to ??
          log.owner ??
          log.owner_name;

        return String(owner || "").toLowerCase() === normalizedOwner;
      }),
      tasks: rawData.tasks.filter((task: any) => {
        const owner = task.owner_id ?? task.assigned_to;
        return String(owner || "").toLowerCase() === normalizedOwner;
      }),
    };
  }, [rawData, ownerFilter]);

  const ownerDirectory = useMemo(() => {
    const map: Record<string, string> = {};

    filteredData.contacts.forEach((contact: any) => {
      const ownerId =
        contact.owner_id ??
        contact.assigned_to ??
        contact.owner ??
        contact.owner_name;

      const ownerName =
        contact.owner_name ??
        contact.owner ??
        contact.assigned_to ??
        contact.owner_id;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    filteredData.tasks.forEach((task: any) => {
      const ownerId = task.owner_id ?? task.assigned_to;
      const ownerName = task.owner_name ?? task.assigned_to ?? task.owner_id;

      if (ownerId) {
        map[String(ownerId)] = String(ownerName || ownerId);
      }
    });

    return map;
  }, [filteredData]);

  const brainOutput = useMemo(() => {
    return buildDashboardBrainOutput({
      tasks: (filteredData.tasks ?? []).map((task: any) => ({
        id: String(task.id),
        title: task.title ?? "Untitled task",
        description: task.description ?? null,
        status: normalizeTaskStatus(task.status),
        priority: task.priority ?? null,
        due_at: task.due_at ?? task.due_date ?? null,
        created_at: task.created_at ?? null,
        updated_at: task.updated_at ?? null,
        completed_at:
          normalizeTaskStatus(task.status) === "completed"
            ? task.updated_at ?? task.completed_at ?? null
            : task.completed_at ?? null,
        assigned_to: task.assigned_to ?? null,
        owner_id: task.owner_id ?? null,
        owner_name: task.owner_name ?? null,
        owner_role: task.role ?? null,
        department: task.department ?? null,
        fallback_reason: task.fallback_reason ?? null,
        route_type: isFallbackTask(task.task_type)
          ? "fallback"
          : task.task_type ?? null,
        task_type: task.task_type ?? null,
        manual_override:
          task.fallback_reason === "manual_override" ||
          Boolean(task.manual_override),
        blocked: Boolean(task.blocked),
        contact_id: task.contact_id ?? null,
        estimated_value: Number(task.estimated_value ?? 0) || null,
      })),
      contacts: (filteredData.contacts ?? []).map((contact: any) => ({
        id: String(contact.id),
        first_name: contact.first_name ?? null,
        last_name: contact.last_name ?? null,
        full_name:
  contact.full_name ??
  `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),
        owner_id: contact.owner_id ?? null,
        assigned_to: contact.assigned_to ?? contact.owner ?? null,
        owner_name: contact.owner_name ?? contact.owner ?? null,
        owner_role: null,
        last_contacted_at:
          contact.last_contacted_at ??
          contact.last_outreach_at ??
          contact.updated_at ??
          null,
        updated_at: contact.updated_at ?? null,
        created_at: contact.created_at ?? null,
        phone: contact.phone ?? null,
        email: contact.email ?? null,
        city: contact.city ?? null,
        state: contact.state ?? null,
        employer: contact.employer ?? null,
        occupation: contact.occupation ?? null,
        donor_status: contact.donor_status ?? null,
        pledge_amount: Number(contact.pledge_amount ?? 0) || null,
        donation_total: Number(contact.donation_total ?? 0) || null,
        lifetime_value:
          Number(contact.lifetime_value ?? contact.donation_total ?? 0) || null,
        support_score: Number(contact.support_score ?? 0) || null,
        engagement_score: Number(contact.engagement_score ?? 0) || null,
        needs_follow_up: Boolean(contact.needs_follow_up),
        is_stale: Boolean(contact.is_stale),
      })),
      ownerDirectory,
    });
  }, [filteredData, ownerDirectory]);

  const priorityTasks = useMemo(() => {
    return brainOutput.priorityTasks;
  }, [brainOutput]);

  const priorityContacts = useMemo(() => {
    return brainOutput.priorityContacts;
  }, [brainOutput]);
    const focusEngine = useMemo(() => {
    return buildActionEngineAdapterResult({
      tasks: priorityTasks,
      contacts: priorityContacts,
      opportunities: [],
      ownerDirectory,
    });
  }, [priorityTasks, priorityContacts, ownerDirectory]);

  const focusPage = useMemo(() => {
    return getActionEnginePageData(focusEngine.actionEngine);
  }, [focusEngine]);

  const focusBoard = useMemo(() => {
    const buckets = focusPage?.buckets;

    return {
      immediate: priorityTasks.slice(0, 5),
      fixNow: buckets?.fix_now ?? [],
      followUp: buckets?.follow_up ?? [],
      routing: buckets?.routing ?? [],
      owner: buckets?.owner ?? [],
      pipeline: buckets?.pipeline ?? [],
    };
  }, [focusPage, priorityTasks]);

  const scopedFocusBoard = useMemo(() => {
    const scopeItems = (items: any[], bucket: BucketKey) => {
      let scoped = items;

      if (demoRole !== "admin") {
        scoped = scoped.filter((item) => {
          const itemDepartment = getFocusItemDepartment(item);

          if (demoDepartment === "outreach") {
            return (
              itemDepartment === "outreach" ||
              itemDepartment === "system" ||
              itemDepartment === "finance"
            );
          }

          return (
            itemDepartment === demoDepartment || itemDepartment === "system"
          );
        });
      }

      return scoped.slice(0, getRoleQueueLimit(demoRole, bucket));
    };

    return {
      immediate: scopeItems(focusBoard.immediate ?? [], "immediate"),
      fixNow: scopeItems(focusBoard.fixNow ?? [], "fixNow"),
      followUp: scopeItems(focusBoard.followUp ?? [], "followUp"),
      routing: scopeItems(focusBoard.routing ?? [], "routing"),
      owner: scopeItems(focusBoard.owner ?? [], "owner"),
      pipeline: scopeItems(focusBoard.pipeline ?? [], "pipeline"),
    };
  }, [focusBoard, demoRole, demoDepartment]);

  const queue = useMemo(() => {
    switch (activeBucket) {
      case "fixNow":
        return scopedFocusBoard.fixNow ?? [];
      case "followUp":
        return scopedFocusBoard.followUp ?? [];
      case "routing":
        return scopedFocusBoard.routing ?? [];
      case "owner":
        return scopedFocusBoard.owner ?? [];
      case "pipeline":
        return scopedFocusBoard.pipeline ?? [];
      case "immediate":
      default:
        return scopedFocusBoard.immediate ?? [];
    }
  }, [activeBucket, scopedFocusBoard]);



  const followUpCount = useMemo(() => {
    return scopedFocusBoard.followUp.length;
  }, [scopedFocusBoard]);

  const focusRoleHeadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Move the campaign forward.";
    }

    if (demoRole === "director") {
      return `Run the ${getFocusDepartmentLabel(
        demoDepartment
      )} lane with tighter execution focus.`;
    }

    return `Stay inside your ${getFocusDepartmentLabel(
      demoDepartment
    ).toLowerCase()} work lane and keep the queue moving.`;
  }, [demoRole, demoDepartment]);

  const strategicPushes = useMemo<StrategicPush[]>(() => {
    const pushes: StrategicPush[] = [];

    if (demoRole === "admin") {
      pushes.push({
        id: "outreach-momentum",
        title: "Reinforce Outreach Momentum",
        type: "momentum",
        bucket: "followUp",
        lanes: ["outreach", "finance", "digital"],
        trigger:
          "Engagement is building while follow-up pressure is starting to concentrate.",
        objective:
          "Convert warm engagement into outcomes without losing responsiveness.",
        actions: [
          "Tighten follow-up loop",
          "Convert pending pledges",
          "Align digital signal",
        ],
      });

      pushes.push({
        id: "print-field-gap",
        title: "Resolve Print → Field Delay",
        type: "pressure",
        bucket: "routing",
        lanes: ["print", "field"],
        trigger:
          "Print readiness is available while field deployment still looks exposed.",
        objective:
          "Close the timing gap between ready materials and field movement.",
        actions: [
          "Confirm delivery timing",
          "Adjust turf assignment",
          "Route deployment cleanly",
        ],
      });

      pushes.push({
        id: "finance-stability",
        title: "Stabilize Finance Conversion",
        type: "stabilization",
        bucket: "immediate",
        lanes: ["finance", "outreach"],
        trigger:
          "Pledge pressure and donor follow-through both need cleaner conversion.",
        objective:
          "Keep revenue movement clean while reducing finance drag.",
        actions: [
          "Work donor follow-up",
          "Clear pledge backlog",
          "Protect clean record flow",
        ],
      });
    } else if (demoRole === "director") {
      pushes.push({
        id: `${demoDepartment}-lane-push`,
        title: `Strengthen ${getFocusDepartmentLabel(demoDepartment)} Coordination`,
        type: "stabilization",
        bucket: "immediate",
        lanes: demoDepartment === "outreach" ? ["outreach", "finance"] : [demoDepartment],
        trigger:
          demoDepartment === "outreach"
            ? "Follow-up work and downstream conversion need tighter coordination."
            : `${getFocusDepartmentLabel(demoDepartment)} work needs cleaner coordination inside the lane.`,
        objective:
          demoDepartment === "outreach"
            ? "Keep engagement moving into the next useful action."
            : `Tighten how ${getFocusDepartmentLabel(demoDepartment).toLowerCase()} work is getting worked right now.`,
        actions:
          demoDepartment === "outreach"
            ? ["Tighten follow-up", "Clear finance handoff", "Keep contact flow moving"]
            : ["Review top queue", "Clear exposed blockers", "Keep the lane moving"],
      });
    } else {
      pushes.push({
        id: `${demoDepartment}-operator-push`,
        title: `Keep ${getFocusDepartmentLabel(demoDepartment)} Moving`,
        type: "stabilization",
        bucket: "immediate",
        lanes: [demoDepartment],
        trigger: "The lane needs clean follow-through more than broader visibility.",
        objective: "Stay inside the next useful work and keep the queue moving.",
        actions: ["Start with the top action", "Clear the next blocker", "Keep momentum clean"],
      });
    }

    return pushes.slice(0, 3);
  }, [demoRole, demoDepartment]);


  const activePush = useMemo(() => {
    return strategicPushes.find((push) => push.id === activePushId) ?? null;
  }, [strategicPushes, activePushId]);

  const executionQueue = useMemo(() => {
    if (!activePush) return queue;
    return queue.filter((action: any) => pushMatchesAction(activePush, action));
  }, [queue, activePush]);

  const focusRoleSubheadline = useMemo(() => {
    if (demoRole === "admin") {
      return "Coordinate across lanes. Resolve pressure. Push momentum where it matters.";
    }

    if (demoRole === "director") {
      return `This view narrows the queue around ${getFocusDepartmentLabel(
        demoDepartment
      ).toLowerCase()} so leaders can review, route, and clear work inside their lane.`;
    }

    return `This view strips away cross-org noise and keeps only the actions an individual operator should understand and execute.`;
  }, [demoRole, demoDepartment]);



  async function handlePreviewAction(action: ActionItem) {
    try {
      setPreviewingActionId(action.id);
      setMessage("");

      const result = await dryRunActionItem(action);

      setLastExecution(result);
      setMessage(
        result.ok
          ? `Preview → ${result.message} (${result.mutations.length} mutation${
              result.mutations.length === 1 ? "" : "s"
            })`
          : result.message
      );
    } catch (err: any) {
      setMessage(err?.message || "Failed to preview action");
    } finally {
      setPreviewingActionId(null);
    }
  }

  async function handleExecuteAction(action: ActionItem) {
    try {
      setExecutingActionId(action.id);
      setMessage("");

      const payload = buildExecuteRequestFromAction(action).payload;

      if (
        action.type === "reduce_owner_pressure" ||
        action.type === "rebalance_queue"
      ) {
        setMessage(
          "Queue rebalance actions need targetOwnerId before they can execute."
        );
        return;
      }

      if (action.type === "fix_contact_data") {
        setMessage(
          "Fix contact data actions need payload.fields before they can execute."
        );
        return;
      }

      const result = await executeActionItem(action, payload);

      setLastExecution(result);
      setMessage(result.message);

      if (result.ok) {
        await loadData();
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to execute action");
    } finally {
      setExecutingActionId(null);
    }
  }

  if (loading || roleLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Loading focus mode...</p>
        </div>
      </div>
    );
  }

  if (!dashboardFocusAccess) {
    const departmentLinks = assignedDepartmentRoutes.length
      ? assignedDepartmentRoutes
      : [demoDepartment];

    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Crosshair className="h-3.5 w-3.5" />
              Dashboard Focus
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Dashboard Focus is reserved for campaign leadership.
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                You can still review overall campaign health from the dashboard.
                Execution work should happen inside your assigned department Focus Mode.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Open your department focus lane
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Department users should work from their assigned lane. Dashboard
                Focus stays clean for admin and campaign manager-level decisions.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {departmentLinks.map((department) => (
              <Link
                key={department}
                href={`/dashboard/${department}/focus`}
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {getFocusDepartmentLabel(department)} Focus
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
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
              <Crosshair className="h-3.5 w-3.5" />
              Focus Mode • {dashboardFocusRoleLabel}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {focusRoleHeadline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {focusRoleSubheadline}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
                <AlertTriangle className="h-4 w-4" />
                {scopedFocusBoard.fixNow.length} fix now
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
                <Zap className="h-4 w-4" />
                {scopedFocusBoard.immediate.length} immediate
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                <Users className="h-4 w-4" />
                {followUpCount} follow up
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadData}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Refresh
            </button>

            <button
              onClick={applyMyDashboard}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              My Focus
            </button>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}


      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Strategic Pushes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Start here. These are the coordinated moves most likely to change the campaign’s trajectory.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {strategicPushes.length} pushes
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {strategicPushes.map((push) => {
              const isActivePush = activePush?.id === push.id;

              return (
                <div
                  key={push.id}
                  className={`rounded-3xl border p-5 shadow-sm ${
                    isActivePush
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStrategicPushTone(
                        push.type
                      )}`}
                    >
                      {push.type}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {push.lanes
                        .map((lane) => getFocusDepartmentLabel(lane))
                        .join(" / ")}
                    </span>
                  </div>

                  <p className="mt-4 text-lg font-semibold text-slate-900">
                    {push.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{push.trigger}</p>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Objective
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {push.objective}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {push.actions.map((actionLine) => (
                      <div
                        key={`${push.id}-${actionLine}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                      >
                        {actionLine}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePushId(push.id);
                        setActiveBucket(push.bucket);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      {isActivePush ? "Push Active" : "Activate Push"}
                      <Zap className="h-4 w-4" />
                    </button>

                    {isActivePush ? (
                      <button
                        type="button"
                        onClick={() => setActivePushId(null)}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border-2 border-slate-900 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Execution Surface
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {activePush
                  ? "This execution surface is scoped to the active strategic push."
                  : "Select a strategic push to begin coordinated work."}
              </p>
            </div>

            {activePush ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {executionQueue.length} actions
              </div>
            ) : null}
          </div>

          {activePush ? (
            <>
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Active Push
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {activePush.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {activePush.objective}
                </p>
              </div>

              <div className="space-y-4">
                {executionQueue.length === 0 ? (
                  <div className="rounded-2xl border border-slate-300 bg-slate-50 p-6 text-slate-500">
                    No actions are available in this execution surface right now.
                  </div>
                ) : (
                  executionQueue.map((action: any) => {
                    const isExecuting = executingActionId === action.id;
                    const isPreviewing = previewingActionId === action.id;
                    const reasonLines = getActionReasonLines(action);
                    const itemDepartment = getFocusItemDepartment(action);

                    return (
                      <div
                        key={action.id}
                        className="rounded-2xl border border-slate-300 bg-slate-50 p-6"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatPriorityTone(
                                  action.level ??
                                    action.brain_tier ??
                                    action.priority
                                )}`}
                              >
                                {action.level ??
                                  action.brain_tier ??
                                  action.priority ??
                                  "open"}
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${formatBucketTone(
                                  action.bucket ?? "immediate"
                                )}`}
                              >
                                {String(action.bucket ?? "immediate").replace(
                                  "_",
                                  " "
                                )}
                              </span>

                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {itemDepartment === "system"
                                  ? "system"
                                  : getFocusDepartmentLabel(itemDepartment)}
                              </span>
                            </div>

                            <div>
                              <p className="text-lg font-semibold text-slate-900">
                                {action.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {action.summary ??
                                  action.recommendedAction ??
                                  reasonLines[0] ??
                                  "No summary available."}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Why this now
                              </div>

                              {reasonLines.map((reason) => (
                                <div
                                  key={`${action.id}-${reason}`}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                                >
                                  {reason}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3 lg:w-[300px]">
                            <div className="rounded-2xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-700">
                              {action.recommendedAction ??
                                reasonLines[0] ??
                                "Review this action before execution."}
                            </div>

                            <div className="flex gap-2">
                              {"type" in action ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePreviewAction(action as ActionItem)
                                    }
                                    disabled={isExecuting || isPreviewing}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isPreviewing ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Previewing
                                      </>
                                    ) : (
                                      <>
                                        Preview
                                        <ArrowRight className="h-4 w-4" />
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleExecuteAction(action as ActionItem)
                                    }
                                    disabled={isExecuting || isPreviewing}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isExecuting ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Working
                                      </>
                                    ) : (
                                      <>
                                        {demoRole === "general_user"
                                          ? "Do this next"
                                          : "Work this action"}
                                        <Zap className="h-4 w-4" />
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
                                <div className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-500">
                                  Brain-ranked task view only
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">
                Select a strategic push to begin coordinated work.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Dashboard Focus should start with campaign direction, then open into execution.
              </p>
            </div>
          )}
        </div>
      </section>

            
    </div>
  );
}