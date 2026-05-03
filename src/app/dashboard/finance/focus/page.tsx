"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ContactRound,
  FileSpreadsheet,
  HandCoins,
  Landmark,
  ListChecks,
  Phone,
  PhoneCall,
  PhoneForwarded,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { createAutoTaskForOutcome, saveOutreachLog } from "@/lib/data/outreach";
import {
  getFinanceCallTargets,
  getLiveFinanceCallTargets,
  type FinanceCallTarget,
} from "@/lib/finance/call-targets";

type FocusLaneItem = {
  id: string;
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  type: "pledge" | "compliance" | "entry";
  contactName?: string;
  amount?: number;
  callTargetStatus?: FinanceCallTarget["status"];
};

type ActivePledgeExecution = {
  id: string;
  title: string;
  summary: string;
  contactName: string;
  amount: number;
  status: "pledged" | "follow_up";
};

type ActiveComplianceExecution = {
  id: string;
  title: string;
  summary: string;
  contactName: string;
  missingFields: string[];
  amount: number;
};

type ActiveEntryExecution = {
  id: string;
  title: string;
  summary: string;
  entryType: "check" | "cash" | "online";
  amount: number;
  owner: string;
};

type CallOutcome =
  | "pledged"
  | "follow_up"
  | "no_answer"
  | "wrong_time"
  | "completed";

type NextActionPlan = {
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  category: "conversion" | "retry" | "task" | "review";
  autoReady: boolean;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function priorityTone(priority: "high" | "medium" | "low") {
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
    case "pledge":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "compliance":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "entry":
    default:
      return "bg-sky-100 text-sky-700 border border-sky-200";
  }
}

function callOutcomeTone(outcome: CallOutcome) {
  switch (outcome) {
    case "pledged":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "follow_up":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "no_answer":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "wrong_time":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "completed":
    default:
      return "border-purple-200 bg-purple-50 text-purple-800";
  }
}

function nextActionCategoryTone(category: NextActionPlan["category"]) {
  switch (category) {
    case "conversion":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "retry":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "task":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "review":
    default:
      return "border-purple-200 bg-purple-50 text-purple-800";
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function buildNextActionPlan(
  outcome: CallOutcome,
  contactName: string,
  followUpDate: string,
  amount: number
): NextActionPlan {
  if (outcome === "pledged") {
    return {
      title: "Lock conversion",
      summary: `Confirm the ${currency.format(
        amount
      )} donation from ${contactName}, send acknowledgement, and keep this contact in a short conversion follow-up window.`,
      priority: "high",
      category: "conversion",
      autoReady: true,
    };
  }

  if (outcome === "follow_up") {
    return {
      title: "Schedule pledge conversion follow-up",
      summary: `Follow up with ${contactName} on ${followUpDate} and keep this contact near the top of the finance call queue until resolved.`,
      priority: "high",
      category: "task",
      autoReady: true,
    };
  }

  if (outcome === "wrong_time") {
    return {
      title: "Retry at better time",
      summary: `Retry ${contactName} on ${followUpDate} and preserve context from this call so the next touch is cleaner.`,
      priority: "medium",
      category: "retry",
      autoReady: true,
    };
  }

  if (outcome === "no_answer") {
    return {
      title: "Requeue contact",
      summary: `Requeue ${contactName} for another attempt and keep them in rotation without losing the finance ask context.`,
      priority: "medium",
      category: "retry",
      autoReady: true,
    };
  }

  return {
    title: "Review call outcome",
    summary: `Review the result for ${contactName}, decide whether this should become a finance task, and determine whether the contact should remain active in the queue.`,
    priority: "low",
    category: "review",
    autoReady: false,
  };
}

export default function FinanceFocusModePage() {
  const [activePledge, setActivePledge] =
    useState<ActivePledgeExecution | null>(null);
  const [activeCompliance, setActiveCompliance] =
    useState<ActiveComplianceExecution | null>(null);
  const [activeEntry, setActiveEntry] =
    useState<ActiveEntryExecution | null>(null);

  const [pledgeConfirmed, setPledgeConfirmed] = useState<string | null>(null);
  const [complianceConfirmed, setComplianceConfirmed] = useState<string | null>(
    null
  );
  const [entryConfirmed, setEntryConfirmed] = useState<string | null>(null);

  const [pledgeAction, setPledgeAction] = useState<
    "Convert Pledge" | "Schedule Follow-Up"
  >("Convert Pledge");
  const [entryMethod, setEntryMethod] = useState<"check" | "cash" | "online">(
    "check"
  );

  const [fieldEmployer, setFieldEmployer] = useState("Updated Employer");
  const [fieldOccupation, setFieldOccupation] = useState("Updated Occupation");

  const [callSessionStarted, setCallSessionStarted] = useState(false);
  const [callIndex, setCallIndex] = useState(0);
  const [callLog, setCallLog] = useState<
    Array<{
      targetId: string;
      contactName: string;
      outcome: CallOutcome;
      amount: number;
      note: string;
    }>
  >([]);
  const [lastCallMessage, setLastCallMessage] = useState("");
  const [nextAction, setNextAction] = useState<NextActionPlan | null>(null);
  const [followUpDate, setFollowUpDate] = useState("2026-04-13");
  const [callNote, setCallNote] = useState("");
  const [callTargets, setCallTargets] = useState<FinanceCallTarget[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [hasFinanceAccess, setHasFinanceAccess] = useState(false);
  const [hasFinanceDirector, setHasFinanceDirector] = useState(false);
  const [hasFinanceUser, setHasFinanceUser] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTargets() {
      try {
        const liveTargets = await getLiveFinanceCallTargets();

        if (!mounted) return;

        if (liveTargets.length > 0) {
          setCallTargets(liveTargets);
        } else {
          setCallTargets(getFinanceCallTargets());
        }
      } catch (error) {
        console.error("Failed to load live finance targets:", error);

        if (!mounted) return;
        setCallTargets(getFinanceCallTargets());
      } finally {
        if (mounted) {
          setLoadingTargets(false);
        }
      }
    }

    loadTargets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadFinanceRoleContext() {
      try {
        setRoleLoading(true);

        const response = await fetch("/api/admin/org-members");
        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          console.error("Failed to load finance role context:", data?.error);
          setHasFinanceAccess(false);
          setHasFinanceDirector(false);
          setHasFinanceUser(false);
          return;
        }

        const currentMemberId = data?.currentMember?.id;
        const roles = Array.isArray(data?.roles) ? data.roles : [];

        const myRoles = roles.filter(
          (role: any) => role.organization_member_id === currentMemberId
        );

        const normalizedFinanceRoles = myRoles.filter(
          (role: any) => String(role.department || "").toLowerCase() === "finance"
        );

        const financeDirector = normalizedFinanceRoles.some(
          (role: any) =>
            ["admin", "campaign_manager", "director", "finance_director"].includes(
              String(role.role_level || "").toLowerCase()
            )
        );

        const financeUser = normalizedFinanceRoles.some((role: any) =>
          ["user", "general_user", "finance_user"].includes(
            String(role.role_level || "").toLowerCase()
          )
        );

        const legacyRole = String(data?.currentMember?.role || "").toLowerCase();
        const legacyDepartment = String(
          data?.currentMember?.department || ""
        ).toLowerCase();

        const legacyAdminAccess = legacyRole === "admin";
        const legacyFinanceAccess = legacyDepartment === "finance";

        setHasFinanceDirector(financeDirector || legacyAdminAccess);
        setHasFinanceUser(financeUser || legacyFinanceAccess);
        setHasFinanceAccess(
          normalizedFinanceRoles.length > 0 || legacyAdminAccess || legacyFinanceAccess
        );
      } catch (error) {
        console.error("Failed to load finance role context:", error);

        if (!mounted) return;
        setHasFinanceAccess(false);
        setHasFinanceDirector(false);
        setHasFinanceUser(false);
      } finally {
        if (mounted) {
          setRoleLoading(false);
        }
      }
    }

    loadFinanceRoleContext();

    return () => {
      mounted = false;
    };
  }, []);

  const nowLine = useMemo(() => {
    if (hasFinanceDirector) {
      return {
        headline: "Direct the finance lane.",
        body:
          "Spot donor pressure, route the highest-value work, and keep calls moving without drowning operators in strategy.",
      };
    }

    return {
      headline: "Stay in finance execution flow.",
      body:
        "Call time comes first. Work the queue, log outcomes, and keep donor follow-up clean.",
    };
  }, [hasFinanceDirector]);

  const focusItems = useMemo<FocusLaneItem[]>(() => {
    const donorDrivenItems: FocusLaneItem[] = callTargets.slice(0, 4).map((target) => ({
      id: target.id,
      title:
        target.status === "pledged"
          ? `Collect ${target.contactName} pledge`
          : target.status === "follow_up"
            ? `Follow up with ${target.contactName}`
            : `Call ${target.contactName}`,
      summary: target.reason,
      priority: target.priority,
      type: "pledge",
      contactName: target.contactName,
      amount: target.amount,
      callTargetStatus: target.status,
    }));

    const fallbackPledgeItems: FocusLaneItem[] = [
      {
        id: "focus-1",
        title: "Collect Michael Ross pledge",
        summary:
          "A pledged contribution is still waiting to be collected and should be converted before it stalls in the workflow.",
        priority: "high",
        type: "pledge",
        contactName: "Michael Ross",
        amount: 3200,
        callTargetStatus: "pledged",
      },
      {
        id: "focus-4",
        title: "Schedule second pledge follow-up block",
        summary:
          "Open pledge follow-ups should be organized into the next active collection block.",
        priority: "medium",
        type: "pledge",
        contactName: "Open pledge block",
        amount: 5400,
        callTargetStatus: "follow_up",
      },
    ];

    const operationalItems: FocusLaneItem[] = [
      {
        id: "focus-2",
        title: "Fix James Carter compliance data",
        summary:
          "A recorded contribution is missing required fields and should be completed before export readiness is affected.",
        priority: "high",
        type: "compliance",
      },
      {
        id: "focus-3",
        title: "Enter weekend fundraiser checks",
        summary:
          "Recent fundraiser checks still need to be entered so reporting and cash flow stay accurate.",
        priority: "medium",
        type: "entry",
      },
      {
        id: "focus-5",
        title: "Complete missing employer and occupation records",
        summary:
          "Compliance cleanup should happen before those contributions become a reporting risk.",
        priority: "medium",
        type: "compliance",
      },
      {
        id: "focus-6",
        title: "Log manual cash receipts from event table",
        summary:
          "Offline receipts should be entered quickly so totals and compliance workflows stay current.",
        priority: "low",
        type: "entry",
      },
    ];

    return [
      ...(donorDrivenItems.length > 0 ? donorDrivenItems : fallbackPledgeItems),
      ...operationalItems,
    ];
  }, [callTargets]);

  const grouped = useMemo(() => {
    return {
      pledge: focusItems.filter((item) => item.type === "pledge"),
      compliance: focusItems.filter((item) => item.type === "compliance"),
      entry: focusItems.filter((item) => item.type === "entry"),
    };
  }, [focusItems]);

  const activeCallTarget = callTargets[callIndex] ?? null;
  const activeCallContactHref =
    activeCallTarget && isUuid(activeCallTarget.contactId)
      ? `/dashboard/contacts/${activeCallTarget.contactId}`
      : "/dashboard/contacts";

  const callSessionStats = useMemo(() => {
    const pledgedTotal = callLog
      .filter((item) => item.outcome === "pledged")
      .reduce((sum, item) => sum + item.amount, 0);

    const followUps = callLog.filter(
      (item) => item.outcome === "follow_up" || item.outcome === "wrong_time"
    ).length;

    const completed = callLog.length;
    const remaining = Math.max(callTargets.length - completed, 0);

    return {
      pledgedTotal,
      followUps,
      completed,
      remaining,
    };
  }, [callLog, callTargets.length]);

  function startCallSession() {
    setCallSessionStarted(true);
    setCallIndex(0);
    setCallLog([]);
    setLastCallMessage("");
    setNextAction(null);
    setCallNote("");
    setFollowUpDate("2026-04-13");
  }

  function resetCallSession() {
    setCallSessionStarted(false);
    setCallIndex(0);
    setCallLog([]);
    setLastCallMessage("");
    setNextAction(null);
    setCallNote("");
    setFollowUpDate("2026-04-13");
  }

  async function advanceCallSession(
    outcome: CallOutcome,
    defaultNote?: string,
    amountOverride?: number
  ) {
    if (!activeCallTarget) return;
        const entryAmount =
      typeof amountOverride === "number" ? amountOverride : activeCallTarget.amount;

    const entryNote = callNote.trim() || defaultNote || "Finance call logged.";

    const mappedResult =
      outcome === "pledged"
        ? "positive - pledge"
        : outcome === "follow_up"
          ? "follow up"
          : outcome === "no_answer"
            ? "no answer"
            : outcome === "wrong_time"
              ? "callback requested"
              : "completed";

    if (isUuid(activeCallTarget.contactId)) {
      try {
        await saveOutreachLog({
          contactId: activeCallTarget.contactId,
          listId: null,
          channel: "call",
          result: mappedResult,
          notes: entryNote,
        });

        await createAutoTaskForOutcome({
          contactId: activeCallTarget.contactId,
          listId: null,
          channel: "call",
          result: mappedResult,
          contactName: activeCallTarget.contactName,
          listName: "Finance Call Session",
          ownerName: "Finance Team",
        });
      } catch (error) {
        console.error("Finance call session sync failed:", error);
      }
    }

    setCallLog((current) => [
      ...current,
      {
        targetId: activeCallTarget.id,
        contactName: activeCallTarget.contactName,
        outcome,
        amount: entryAmount,
        note: entryNote,
      },
    ]);

    if (outcome === "pledged") {
      setLastCallMessage(
        `${activeCallTarget.contactName} committed ${currency.format(
          entryAmount
        )}. Logged into outreach and moving to next call target.`
      );
    } else if (outcome === "follow_up") {
      setLastCallMessage(
        `Follow-up scheduled for ${activeCallTarget.contactName} on ${followUpDate}. Logged into outreach and moving to next call target.`
      );
    } else if (outcome === "wrong_time") {
      setLastCallMessage(
        `${activeCallTarget.contactName} asked for a better time. Added follow-up for ${followUpDate} and logged into outreach.`
      );
    } else if (outcome === "no_answer") {
      setLastCallMessage(
        `No answer from ${activeCallTarget.contactName}. Logged into outreach and recycling attention to the next target.`
      );
    } else {
      setLastCallMessage(
        `Call completed for ${activeCallTarget.contactName}. Logged into outreach and moving forward.`
      );
    }

    setNextAction(
      buildNextActionPlan(
        outcome,
        activeCallTarget.contactName,
        followUpDate,
        entryAmount
      )
    );

    setCallNote("");
    setCallIndex((current) => current + 1);
  }

  function openPledgePanel(item: FocusLaneItem) {
    const mapped: Record<string, ActivePledgeExecution> = {
      "focus-1": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        contactName: "Michael Ross",
        amount: 3200,
        status: "pledged",
      },
      "focus-4": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        contactName: "Open pledge block",
        amount: 5400,
        status: "follow_up",
      },
    };

    const selected = mapped[item.id] ?? {
      id: item.id,
      title: item.title,
      summary: item.summary,
      contactName: item.contactName || "Finance Contact",
      amount: item.amount || 1000,
      status: item.callTargetStatus === "follow_up" ? "follow_up" : "pledged",
    };

    setActivePledge(selected);
    setPledgeAction(
      selected.status === "pledged" ? "Convert Pledge" : "Schedule Follow-Up"
    );
    setPledgeConfirmed(null);
  }

  function confirmPledgeAction() {
    if (!activePledge) return;
    setPledgeConfirmed(activePledge.id);
  }

  function clearPledgePanel() {
    setActivePledge(null);
    setPledgeConfirmed(null);
  }

  function openCompliancePanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveComplianceExecution> = {
      "focus-2": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        contactName: "James Carter",
        missingFields: ["Employer", "Occupation"],
        amount: 1000,
      },
      "focus-5": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        contactName: "Multiple contribution records",
        missingFields: ["Employer", "Occupation"],
        amount: 2500,
      },
    };

    const selected = mapped[item.id] ?? {
      id: item.id,
      title: item.title,
      summary: item.summary,
      contactName: "Finance Contact",
      missingFields: ["Employer", "Occupation"],
      amount: 500,
    };

    setActiveCompliance(selected);
    setFieldEmployer("Updated Employer");
    setFieldOccupation("Updated Occupation");
    setComplianceConfirmed(null);
  }

  function confirmComplianceAction() {
    if (!activeCompliance) return;
    setComplianceConfirmed(activeCompliance.id);
  }

  function clearCompliancePanel() {
    setActiveCompliance(null);
    setComplianceConfirmed(null);
  }

  function openEntryPanel(item: FocusLaneItem) {
    const mapped: Record<string, ActiveEntryExecution> = {
      "focus-3": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        entryType: "check",
        amount: 4800,
        owner: "Maya",
      },
      "focus-6": {
        id: item.id,
        title: item.title,
        summary: item.summary,
        entryType: "cash",
        amount: 650,
        owner: "Finance Team",
      },
    };

    const selected = mapped[item.id] ?? {
      id: item.id,
      title: item.title,
      summary: item.summary,
      entryType: "online" as const,
      amount: 1000,
      owner: "Finance Team",
    };

    setActiveEntry(selected);
    setEntryMethod(selected.entryType);
    setEntryConfirmed(null);
  }

  function confirmEntryAction() {
    if (!activeEntry) return;
    setEntryConfirmed(activeEntry.id);
  }

  function clearEntryPanel() {
    setActiveEntry(null);
    setEntryConfirmed(null);
  }

  const callSessionComplete =
    callSessionStarted && callSessionStats.completed >= callTargets.length;

  const financeRoleLabel = hasFinanceDirector
    ? "Finance Director"
    : hasFinanceUser
      ? "Finance User"
      : "No Finance Role";

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading finance context...</p>
        </section>
      </div>
    );
  }

  if (!hasFinanceAccess) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Finance Focus Mode</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                No Finance Role Assigned
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                You are not currently assigned to Finance. Ask your campaign admin
                to add a Finance Director or Finance User role before working this
                lane.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                View Profile
              </Link>
            </div>
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
              Finance Focus Mode
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
              {financeRoleLabel}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {nowLine.headline}
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 lg:text-base">
                {nowLine.body}
              </p>
              <p className="text-sm text-slate-400">
                
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Back to Finance
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ListChecks className="h-4 w-4" />
              Lists
            </Link>

            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ContactRound className="h-4 w-4" />
              Contacts
            </Link>
          </div>
        </div>
      </section>

      {!hasFinanceDirector ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Execution Lane
              </p>
              <h2 className="mt-2 text-xl font-semibold text-emerald-950">
                Your finance work starts with donor calls.
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-emerald-800">
                Strategy signals stay with finance leadership. Your job is to work the call queue, log clean outcomes, and keep pledge follow-up moving.
              </p>
            </div>

            <a
              href="#finance-call-time"
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Start with calls
              <PhoneCall className="h-4 w-4" />
            </a>
          </div>
        </section>
      ) : null}


      {hasFinanceDirector ? (
      <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-white p-6 shadow-md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
              <Sparkles className="h-3.5 w-3.5" />
              Jackpot Priority Bridge
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">
              Neglected opportunity detected
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-700">
              Aether has identified donor value currently underworked. Route high-opportunity signals into execution before normal call flow.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-slate-500">Latent Value</p>
              <p className="mt-2 text-xl font-semibold text-amber-800">$18,400</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-slate-500">Priority Donors</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">2</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-slate-500">Conversion Risk</p>
              <p className="mt-2 text-xl font-semibold text-rose-700">1</p>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-amber-700">Abe Read</p>
          <p className="mt-2 text-sm text-slate-700">
            Jackpot Priority Bridge sees latent donor value sitting idle. Recommended first action: call Michael Ross pledge now.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/finance/jackpot"
              className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-600"
            >
              Open Jackpot Queue
            </Link>
            <a
              href="#finance-call-time"
              className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-50"
            >
              Route to Call Session
            </a>
          </div>
        </div>
      </section>
      ) : null}

      <section id="finance-call-time" className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-800">
              Finance Call Time
            </p>
            <h2 className="text-xl font-semibold text-emerald-900">
              Run Donor Calls Inside Aether
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Convert pledges, re-engage donors, and log outcomes without leaving
              the system.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/lists"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
            >
              <ListChecks className="h-4 w-4" />
              View Lists
            </Link>

            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
            >
              <ContactRound className="h-4 w-4" />
              View Contacts
            </Link>

            {!callSessionStarted ? (
              <button
                onClick={startCallSession}
                disabled={loadingTargets}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PhoneCall className="h-4 w-4" />
                {loadingTargets ? "Loading Targets..." : "Start Call Session"}
              </button>
            ) : (
              <button
                onClick={resetCallSession}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
              >
                Reset Session
              </button>
            )}
          </div>
        </div>

        {callSessionStarted ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {!callSessionComplete ? (
                <>
                  {activeCallTarget ? (
                    <div className="rounded-2xl border border-emerald-300 bg-white p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                            activeCallTarget.priority
                          )}`}
                        >
                          {activeCallTarget.priority}
                        </span>
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          call target
                        </span>
                      </div>

                      <p className="mt-3 text-lg font-semibold text-slate-900">
                        {activeCallTarget.contactName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {activeCallTarget.city}, {activeCallTarget.state}
                      </p>
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-xs text-slate-400">Phone</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {activeCallTarget.phone}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-xs text-slate-400">Last Contact</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {activeCallTarget.lastContact}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3 col-span-2">
                          <p className="text-xs text-slate-400">
                            Suggested Ask
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {activeCallTarget.suggestedAsk}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3 col-span-2">
                          <p className="text-xs text-slate-400">Reason</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {activeCallTarget.reason}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Link
                          href={activeCallContactHref}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <ContactRound className="h-4 w-4" />
                          Open Contact
                        </Link>

                        <Link
                          href="/dashboard/lists"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <ListChecks className="h-4 w-4" />
                          View Lists
                        </Link>

                        <Link
                          href="/dashboard/lists"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <PhoneForwarded className="h-4 w-4" />
                          Add to List
                        </Link>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          List Context
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          This target should stay tied to finance call lists and donor
                          follow-up groupings so execution stays aligned across Finance,
                          Contacts, and Outreach.
                        </p>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Script
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {activeCallTarget.script}
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <input
                          value={callNote}
                          onChange={(e) => setCallNote(e.target.value)}
                          placeholder="Optional call note..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              advanceCallSession("pledged", "Pledge confirmed")
                            }
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Pledged
                          </button>

                          <button
                            onClick={() =>
                              advanceCallSession(
                                "follow_up",
                                "Follow-up scheduled"
                              )
                            }
                            className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600"
                          >
                            Follow-Up
                          </button>

                          <button
                            onClick={() =>
                              advanceCallSession(
                                "wrong_time",
                                "Requested better time"
                              )
                            }
                            className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800"
                          >
                            Wrong Time
                          </button>

                          <button
                            onClick={() =>
                              advanceCallSession("no_answer", "No answer")
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                          >
                            No Answer
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-slate-500">
                            Follow-Up Date
                          </label>
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                      <p className="text-lg font-semibold text-slate-900">
                        No Call Targets Available
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Aether could not find finance call targets right now.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-emerald-300 bg-white p-6 text-center">
                  <p className="text-lg font-semibold text-emerald-900">
                    Call Session Complete
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    You worked through all finance call targets. Review results
                    and start another session if needed.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-500">
                  Session Progress
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Completed</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {callSessionStats.completed}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Remaining</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {callSessionStats.remaining}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Pledged</p>
                    <p className="text-lg font-semibold text-emerald-700">
                      {currency.format(callSessionStats.pledgedTotal)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Follow-Ups</p>
                    <p className="text-lg font-semibold text-amber-700">
                      {callSessionStats.followUps}
                    </p>
                  </div>
                </div>
              </div>

              {lastCallMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  {lastCallMessage}
                </div>
              ) : null}

              {nextAction ? (
                <div
                  className={`rounded-2xl border p-4 ${nextActionCategoryTone(
                    nextAction.category
                  )}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        nextAction.priority
                      )}`}
                    >
                      {nextAction.priority}
                    </span>
                    <span className="inline-flex rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold">
                      {nextAction.category}
                    </span>
                    <span className="inline-flex rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-semibold">
                      {nextAction.autoReady ? "auto-ready" : "manual review"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    {nextAction.title}
                  </p>
                  <p className="mt-1 text-sm">{nextAction.summary}</p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-500">
                  Call Log
                </p>

                <div className="mt-3 space-y-2">
                  {callLog.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No calls logged yet.
                    </p>
                  ) : (
                    callLog.map((entry) => (
                      <div
                        key={entry.targetId + entry.outcome}
                        className={`rounded-xl border px-3 py-2 text-xs ${callOutcomeTone(
                          entry.outcome
                        )}`}
                      >
                        <p className="font-medium">
                          {entry.contactName} — {entry.outcome}
                        </p>
                        <p className="mt-1">
                          {entry.note} • {currency.format(entry.amount)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      
            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr_1fr]">
        <div className="rounded-3xl border-2 border-emerald-300 bg-white p-6 shadow-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pledge Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Collect + Convert
              </h2>
            </div>
            <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {grouped.pledge.map((item) => {
              const isActive = activePledge?.id === item.id;
              const isConfirmed = pledgeConfirmed === item.id;

              if (isActive && activePledge) {
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
                          completed
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">
                      {activePledge.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activePledge.summary}
                    </p>

                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">
                        Pledge Panel
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Contact
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {activePledge.contactName}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Amount
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {currency.format(activePledge.amount)}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Link
                            href="/dashboard/contacts"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <ContactRound className="h-4 w-4" />
                            Contacts
                          </Link>

                          <Link
                            href="/dashboard/lists"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <ListChecks className="h-4 w-4" />
                            Lists
                          </Link>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Action
                          </label>
                          <select
                            value={pledgeAction}
                            onChange={(e) =>
                              setPledgeAction(
                                e.target.value as
                                  | "Convert Pledge"
                                  | "Schedule Follow-Up"
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          >
                            <option>Convert Pledge</option>
                            <option>Schedule Follow-Up</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={confirmPledgeAction}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                          >
                            Confirm Action
                          </button>
                          <button
                            onClick={clearPledgePanel}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        </div>

                        {isConfirmed && (
                          <p className="text-sm font-medium text-emerald-700">
                            Pledge action confirmed: {pledgeAction}.
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openPledgePanel(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      {item.callTargetStatus === "follow_up"
                        ? "Schedule Follow-Up"
                        : "Collect Pledge"}
                    </button>
                    <button
                      onClick={() => openPledgePanel(item)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View Record
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Compliance Lane
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Clear Missing Fields
              </h2>
            </div>
            <Landmark className="h-5 w-5 text-amber-600" />
          </div>

          <div className="space-y-4">
            {grouped.compliance.map((item) => {
              const isActive = activeCompliance?.id === item.id;
              const isConfirmed = complianceConfirmed === item.id;

              if (isActive && activeCompliance) {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
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
                        <span className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                          compliant
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">
                      {activeCompliance.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activeCompliance.summary}
                    </p>

                    <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-amber-700">
                        Compliance Panel
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Contact
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {activeCompliance.contactName}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Contribution Amount
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {currency.format(activeCompliance.amount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Missing Fields
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {activeCompliance.missingFields.join(", ")}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Employer
                          </label>
                          <input
                            value={fieldEmployer}
                            onChange={(e) => setFieldEmployer(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Occupation
                          </label>
                          <input
                            value={fieldOccupation}
                            onChange={(e) => setFieldOccupation(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Link
                            href="/dashboard/contacts"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <ContactRound className="h-4 w-4" />
                            Contacts
                          </Link>

                          <Link
                            href="/dashboard/lists"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <ListChecks className="h-4 w-4" />
                            Lists
                          </Link>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={confirmComplianceAction}
                            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700"
                          >
                            Mark Compliant
                          </button>
                          <button
                            onClick={clearCompliancePanel}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        </div>

                        {isConfirmed && (
                          <p className="text-sm font-medium text-amber-700">
                            Compliance fields completed for{" "}
                            {activeCompliance.contactName}.
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openCompliancePanel(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Fix Compliance
                    </button>
                    <button
                      onClick={() => openCompliancePanel(item)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Review Record
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Entry Lane</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Log + Process
              </h2>
            </div>
            <Users className="h-5 w-5 text-sky-600" />
          </div>
                    <div className="space-y-4">
            {grouped.entry.map((item) => {
              const isActive = activeEntry?.id === item.id;
              const isConfirmed = entryConfirmed === item.id;

              if (isActive && activeEntry) {
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-sky-300 bg-sky-50 p-4"
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
                          entered
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-semibold text-slate-900">
                      {activeEntry.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {activeEntry.summary}
                    </p>

                    <div className="mt-4 rounded-2xl border border-sky-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-sky-700">
                        Entry Panel
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Owner
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {activeEntry.owner}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Entry Amount
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {currency.format(activeEntry.amount)}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-900">
                            Method
                          </label>
                          <select
                            value={entryMethod}
                            onChange={(e) =>
                              setEntryMethod(
                                e.target.value as "check" | "cash" | "online"
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          >
                            <option value="check">Check</option>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                          </select>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Link
                            href="/dashboard/contacts"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <ContactRound className="h-4 w-4" />
                            Contacts
                          </Link>

                          <Link
                            href="/dashboard/lists"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <ListChecks className="h-4 w-4" />
                            Lists
                          </Link>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={confirmEntryAction}
                            className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-700"
                          >
                            Confirm Entry
                          </button>
                          <button
                            onClick={clearEntryPanel}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Clear
                          </button>
                        </div>

                        {isConfirmed && (
                          <p className="text-sm font-medium text-sky-700">
                            Finance entry confirmed as {entryMethod}.
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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

                  <p className="mt-3 font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openEntryPanel(item)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      {item.id === "focus-3" ? "Enter Checks" : "Log Cash"}
                    </button>
                    <button
                      onClick={() => openEntryPanel(item)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Review Batch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

<section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">
              Pledge
            </p>
            <HandCoins className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-2 text-xl font-semibold text-emerald-900">
            {grouped.pledge.length}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Collection and follow-up actions
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-800">
              Compliance
            </p>
            <CheckCircle2 className="h-5 w-5 text-amber-700" />
          </div>
          <p className="mt-2 text-xl font-semibold text-amber-900">
            {grouped.compliance.length}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Missing data and export-readiness work
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-sky-800">
              Entry
            </p>
            <FileSpreadsheet className="h-5 w-5 text-sky-700" />
          </div>
          <p className="mt-2 text-xl font-semibold text-sky-900">
            {grouped.entry.length}
          </p>
          <p className="mt-1 text-xs text-sky-800">
            Contribution and receipt entry actions
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Call Targets</p>
            <Phone className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {callTargets.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {loadingTargets
              ? "Loading live finance targets"
              : "Native finance call session queue"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Finance Operating Pattern
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              {hasFinanceDirector
                ? "Director mode keeps donor strategy, jackpot pressure, pledge conversion, compliance cleanup, and entry work visible in one finance command lane."
                : "User mode strips out finance strategy and keeps the work focused: run donor calls, log outcomes, collect pledges, and keep records clean."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}