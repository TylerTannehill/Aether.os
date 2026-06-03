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
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { createAutoTaskForOutcome, saveOutreachLog } from "@/lib/data/outreach";
import { supabase } from "@/lib/supabase";
import { getOrgContextTheme } from "@/lib/org-context-theme";

type Priority = "high" | "medium" | "low";
type PaymentMethod = "check" | "cash" | "online";

type CallOutcome =
  | "pledged"
  | "follow_up"
  | "no_answer"
  | "wrong_time"
  | "completed";

type ContactRecord = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  employer?: string | null;
  occupation?: string | null;
  organization_id?: string | null;
  donation_total?: number | string | null;
  pledge_amount?: number | string | null;
  fec_total_given?: number | string | null;
  fec_donor_tier?: string | null;
  jackpot_candidate?: boolean | null;
  jackpot_anomaly_type?: string | null;
  jackpot_reason?: string | null;
  updated_at?: string | null;
};

type ContributionRecord = {
  id: string;
  contact_id?: string | null;
  amount?: number | string | null;
  source?: string | null;
  date?: string | null;
  created_at?: string | null;
  organization_id?: string | null;
};

type PledgeRecord = {
  id: string;
  contact_id?: string | null;
  amount_pledged?: number | string | null;
  amount_fulfilled?: number | string | null;
  status?: string | null;
  next_follow_up?: string | null;
  created_at?: string | null;
};

type FocusPledge = {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  amount: number;
  amountFulfilled: number;
  remaining: number;
  status: string;
  nextFollowUp?: string | null;
  priority: Priority;
};

type ComplianceItem = {
  id: string;
  contactId: string;
  contactName: string;
  amount: number;
  missingFields: string[];
  priority: Priority;
  contact: ContactRecord;
};

type FinanceCallTarget = {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
  amount: number;
  priority: Priority;
  reason: string;
  suggestedAsk: string;
  script: string;
  status: "pledged" | "follow_up" | "reconnect";
  lastContact: string;
};

type NextActionPlan = {
  title: string;
  summary: string;
  priority: Priority;
  category: "conversion" | "retry" | "task" | "review";
  autoReady: boolean;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function fullName(contact: ContactRecord) {
  const name =
    contact.full_name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();

  return name || contact.email || "Unnamed Contact";
}

function priorityTone(priority: Priority) {
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

function getSuggestedAsk(contact: ContactRecord, amount: number) {
  if (toNumber(contact.pledge_amount) > 0) {
    return `Confirm the ${currency.format(toNumber(contact.pledge_amount))} pledge and collect cleanly.`;
  }

  if (contact.jackpot_candidate) {
    return `Open with the donor opportunity context and test a ${currency.format(amount)} ask.`;
  }

  if (toNumber(contact.donation_total) > 0) {
    return `Thank them for prior support and ask for ${currency.format(amount)} today.`;
  }

  return `Lead with campaign urgency and ask for ${currency.format(amount)}.`;
}

function getScript(contact: ContactRecord, amount: number) {
  const name = fullName(contact);

  if (toNumber(contact.pledge_amount) > 0) {
    return `${name}, thanks again for backing the campaign. I’m reaching out to confirm your ${currency.format(
      toNumber(contact.pledge_amount),
    )} pledge and lock in collection today so we can keep finance clean and moving.`;
  }

  return `${name}, thank you again for being in our campaign orbit. I’m reaching out because we’re in an active push and wanted to ask whether ${currency.format(
    amount,
  )} is possible today to help us close strong.`;
}

function getPriority(amount: number, contact?: ContactRecord): Priority {
  if (contact?.jackpot_candidate) return "high";
  if (amount >= 1000) return "high";
  if (amount >= 250) return "medium";
  return "low";
}

function buildNextActionPlan(
  outcome: CallOutcome,
  contactName: string,
  followUpDate: string,
  amount: number,
): NextActionPlan {
  if (outcome === "pledged") {
    return {
      title: "Lock conversion",
      summary: `Confirm the ${currency.format(
        amount,
      )} commitment from ${contactName}, send acknowledgement, and keep the record clean.`,
      priority: "high",
      category: "conversion",
      autoReady: true,
    };
  }

  if (outcome === "follow_up") {
    return {
      title: "Schedule pledge conversion follow-up",
      summary: `Follow up with ${contactName} on ${followUpDate} and keep this contact near the top of the finance queue.`,
      priority: "high",
      category: "task",
      autoReady: true,
    };
  }

  if (outcome === "wrong_time") {
    return {
      title: "Retry at better time",
      summary: `Retry ${contactName} on ${followUpDate} and preserve context from this call.`,
      priority: "medium",
      category: "retry",
      autoReady: true,
    };
  }

  if (outcome === "no_answer") {
    return {
      title: "Requeue contact",
      summary: `Requeue ${contactName} for another attempt without losing the finance ask context.`,
      priority: "medium",
      category: "retry",
      autoReady: true,
    };
  }

  return {
    title: "Review call outcome",
    summary: `Review the result for ${contactName} and decide whether this should remain active in the queue.`,
    priority: "low",
    category: "review",
    autoReady: false,
  };
}

async function getActiveOrganizationId() {
  try {
    const response = await fetch("/api/auth/current-context", {
      credentials: "include",
    });

    if (!response.ok) return null;

    const payload = await response.json();

    return (
      payload?.organization?.id ||
      payload?.membership?.organization_id ||
      null
    );
  } catch (error) {
    console.error("Failed to resolve finance focus org:", error);
    return null;
  }
}

export default function FinanceFocusModePage() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [pledges, setPledges] = useState<PledgeRecord[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [hasFinanceAccess, setHasFinanceAccess] = useState(false);
  const [hasFinanceDirector, setHasFinanceDirector] = useState(false);
  const [hasFinanceUser, setHasFinanceUser] = useState(false);
  const [contextMode, setContextMode] = useState("default");

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
  const [followUpDate, setFollowUpDate] = useState(todayIsoDate());
  const [callNote, setCallNote] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  const [paymentDate, setPaymentDate] = useState(todayIsoDate());
  const [paymentMessage, setPaymentMessage] = useState("");

  const [activePledgeId, setActivePledgeId] = useState<string | null>(null);
  const [pledgePaymentAmount, setPledgePaymentAmount] = useState("");
  const [pledgePaymentMethod, setPledgePaymentMethod] =
    useState<PaymentMethod>("check");
  const [pledgePaymentDate, setPledgePaymentDate] = useState(todayIsoDate());
  const [pledgeMessage, setPledgeMessage] = useState("");

  const [activeComplianceId, setActiveComplianceId] = useState<string | null>(
    null,
  );
  const [complianceDraft, setComplianceDraft] = useState({
    first_name: "",
    last_name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    employer: "",
    occupation: "",
  });
  const [complianceMessage, setComplianceMessage] = useState("");

  async function loadFinanceRecords() {
    try {
      setLoadingTargets(true);

      const organizationId = await getActiveOrganizationId();

      let contactsQuery = supabase
        .from("contacts")
        .select(
          "id, first_name, last_name, full_name, email, phone, street, address, city, state, zip, employer, occupation, organization_id, donation_total, pledge_amount, fec_total_given, fec_donor_tier, jackpot_candidate, jackpot_anomaly_type, jackpot_reason, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(100);

      if (organizationId) {
        contactsQuery = contactsQuery.eq("organization_id", organizationId);
      }

      const { data: contactData, error: contactError } = await contactsQuery;

      if (contactError) throw contactError;

      const safeContacts = (contactData as ContactRecord[] | null) ?? [];
      const contactIds = safeContacts.map((contact) => contact.id);

      if (contactIds.length === 0) {
        setContacts([]);
        setContributions([]);
        setPledges([]);
        return;
      }

      const { data: contributionData, error: contributionError } =
        await supabase
          .from("contributions")
          .select("id, contact_id, amount, source, date, created_at, organization_id")
          .in("contact_id", contactIds)
          .order("date", { ascending: false });

      if (contributionError) throw contributionError;

      const { data: pledgeData, error: pledgeError } = await supabase
        .from("pledges")
        .select("id, contact_id, amount_pledged, amount_fulfilled, status, next_follow_up, created_at")
        .in("contact_id", contactIds)
        .order("created_at", { ascending: false });

      if (pledgeError) throw pledgeError;

      setContacts(safeContacts);
      setContributions((contributionData as ContributionRecord[] | null) ?? []);
      setPledges((pledgeData as PledgeRecord[] | null) ?? []);
    } catch (error) {
      console.error("Failed to load finance focus records:", error);
      setContacts([]);
      setContributions([]);
      setPledges([]);
    } finally {
      setLoadingTargets(false);
    }
  }

  useEffect(() => {
    loadFinanceRecords();
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
          setHasFinanceAccess(false);
          setHasFinanceDirector(false);
          setHasFinanceUser(false);
          return;
        }

        const currentMemberId = data?.currentMember?.id;
        const roles = Array.isArray(data?.roles) ? data.roles : [];

        try {
          const contextResponse = await fetch("/api/auth/current-context");

          if (contextResponse.ok) {
            const contextData = await contextResponse.json();
            setContextMode(contextData?.organization?.context_mode || "default");
          }
        } catch (contextError) {
          console.error("Failed to load finance focus org context mode:", contextError);
        }

        const myRoles = roles.filter(
          (role: any) => role.organization_member_id === currentMemberId,
        );

        const normalizedFinanceRoles = myRoles.filter(
          (role: any) => String(role.department || "").toLowerCase() === "finance",
        );

        const financeDirector = normalizedFinanceRoles.some((role: any) =>
          ["admin", "campaign_manager", "director", "finance_director"].includes(
            String(role.role_level || "").toLowerCase(),
          ),
        );

        const financeUser = normalizedFinanceRoles.some((role: any) =>
          ["user", "general_user", "finance_user"].includes(
            String(role.role_level || "").toLowerCase(),
          ),
        );

        const legacyRole = String(data?.currentMember?.role || "").toLowerCase();
        const legacyDepartment = String(data?.currentMember?.department || "").toLowerCase();

        const legacyAdminAccess = legacyRole === "admin";
        const legacyFinanceAccess = legacyDepartment === "finance";

        setHasFinanceDirector(financeDirector || legacyAdminAccess);
        setHasFinanceUser(financeUser || legacyFinanceAccess);
        setHasFinanceAccess(
          normalizedFinanceRoles.length > 0 || legacyAdminAccess || legacyFinanceAccess,
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

  const contactById = useMemo(() => {
    return new Map(contacts.map((contact) => [contact.id, contact]));
  }, [contacts]);

  const contributionTotalByContact = useMemo(() => {
    const totals = new Map<string, number>();

    for (const contribution of contributions) {
      if (!contribution.contact_id) continue;
      totals.set(
        contribution.contact_id,
        (totals.get(contribution.contact_id) ?? 0) + toNumber(contribution.amount),
      );
    }

    return totals;
  }, [contributions]);

  const openPledges = useMemo<FocusPledge[]>(() => {
    return pledges
      .map((pledge) => {
        const contact = pledge.contact_id
          ? contactById.get(pledge.contact_id)
          : null;

        if (!contact || !pledge.contact_id) return null;

        const status = String(pledge.status || "pledged").toLowerCase();
        const amount = toNumber(pledge.amount_pledged);
        const amountFulfilled = toNumber(pledge.amount_fulfilled);
        const remaining = Math.max(amount - amountFulfilled, 0);

        if (status === "converted" || remaining <= 0) return null;

        return {
          id: pledge.id,
          contactId: pledge.contact_id,
          contactName: fullName(contact),
          phone: contact.phone || "—",
          amount,
          amountFulfilled,
          remaining,
          status,
          nextFollowUp: pledge.next_follow_up ?? null,
          priority: getPriority(remaining, contact),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const priorityRank = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityRank[(b as FocusPledge).priority] - priorityRank[(a as FocusPledge).priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (b as FocusPledge).remaining - (a as FocusPledge).remaining;
      }) as FocusPledge[];
  }, [pledges, contactById]);

  const complianceItems = useMemo<ComplianceItem[]>(() => {
    return contacts
      .map((contact) => {
        const contributionTotal =
          contributionTotalByContact.get(contact.id) ?? toNumber(contact.donation_total);

        if (contributionTotal <= 0) return null;

        const missingFields: string[] = [];

        if (!String(contact.first_name || "").trim()) missingFields.push("First Name");
        if (!String(contact.last_name || "").trim()) missingFields.push("Last Name");
        if (!String(contact.street || contact.address || "").trim()) missingFields.push("Street / Address");
        if (!String(contact.city || "").trim()) missingFields.push("City");
        if (!String(contact.state || "").trim()) missingFields.push("State");
        if (!String(contact.zip || "").trim()) missingFields.push("Zip");
        if (!String(contact.employer || "").trim()) missingFields.push("Employer");
        if (!String(contact.occupation || "").trim()) missingFields.push("Occupation");

        if (!missingFields.length) return null;

        return {
          id: `compliance-${contact.id}`,
          contactId: contact.id,
          contactName: fullName(contact),
          amount: contributionTotal,
          missingFields,
          priority: missingFields.includes("Employer") || missingFields.includes("Occupation") ? "high" : "medium",
          contact,
        };
      })
      .filter(Boolean) as ComplianceItem[];
  }, [contacts, contributionTotalByContact]);

  const callTargets = useMemo<FinanceCallTarget[]>(() => {
    const pledgeTargets = openPledges.map((pledge) => {
      const contact = contactById.get(pledge.contactId);

      return {
        id: `call-pledge-${pledge.id}`,
        contactId: pledge.contactId,
        contactName: pledge.contactName,
        phone: pledge.phone,
        city: contact?.city || "Unknown",
        state: contact?.state || "—",
        amount: pledge.remaining,
        priority: pledge.priority,
        reason: `Open pledge should be followed up before it cools.`,
        suggestedAsk: `Collect ${currency.format(pledge.remaining)} from open pledge.`,
        script: getScript(contact || { id: pledge.contactId }, pledge.remaining),
        status: "pledged" as const,
        lastContact: pledge.nextFollowUp ? `Next follow-up: ${pledge.nextFollowUp}` : "Open pledge record",
      };
    });

    const donorTargets = contacts
      .filter((contact) => !pledgeTargets.some((target) => target.contactId === contact.id))
      .filter((contact) => contact.phone)
      .map((contact) => {
        const amount = Math.max(
          toNumber(contact.pledge_amount),
          toNumber(contact.donation_total),
          toNumber(contact.fec_total_given),
          contact.jackpot_candidate ? 1000 : 250,
        );

        return {
          id: `call-contact-${contact.id}`,
          contactId: contact.id,
          contactName: fullName(contact),
          phone: contact.phone || "—",
          city: contact.city || "Unknown",
          state: contact.state || "—",
          amount,
          priority: getPriority(amount, contact),
          reason:
            contact.jackpot_reason ||
            (toNumber(contact.donation_total) > 0
              ? "Prior donor should be worked for follow-up."
              : "Callable finance contact is available for donor outreach."),
          suggestedAsk: getSuggestedAsk(contact, amount),
          script: getScript(contact, amount),
          status: contact.jackpot_candidate ? "follow_up" as const : "reconnect" as const,
          lastContact: contact.updated_at ? `Updated: ${contact.updated_at.slice(0, 10)}` : "Live contact record",
        };
      });

    return [...pledgeTargets, ...donorTargets]
      .sort((a, b) => {
        const priorityRank = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityRank[b.priority] - priorityRank[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.amount - a.amount;
      })
      .slice(0, 50);
  }, [contacts, openPledges, contactById]);

  const activeCallTarget = callTargets[callIndex] ?? null;
  const activeCallContactHref =
    activeCallTarget && isUuid(activeCallTarget.contactId)
      ? `/dashboard/contacts/${activeCallTarget.contactId}`
      : "/dashboard/contacts";

  const activePledge = openPledges.find((pledge) => pledge.id === activePledgeId) ?? null;
  const activeCompliance =
    complianceItems.find((item) => item.id === activeComplianceId) ?? null;

  const orgTheme = getOrgContextTheme(contextMode);

  const nowLine = useMemo(() => {
    if (hasFinanceDirector) {
      return {
        headline: "Direct the finance lane.",
        body:
          "Work real pledges, collect real payments, and clean donor records before exports drift.",
      };
    }

    return {
      headline: "Stay in finance execution flow.",
      body:
        "Call donors, record payments, convert pledges, and clean compliance fields without leaving the lane.",
    };
  }, [hasFinanceDirector]);

  const callSessionStats = useMemo(() => {
    const pledgedTotal = callLog
      .filter((item) => item.outcome === "pledged")
      .reduce((sum, item) => sum + item.amount, 0);

    const followUps = callLog.filter(
      (item) => item.outcome === "follow_up" || item.outcome === "wrong_time",
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

  const callSessionComplete =
    callSessionStarted && callSessionStats.completed >= callTargets.length;

  const financeRoleLabel = hasFinanceDirector
    ? "Finance Director"
    : hasFinanceUser
      ? "Finance User"
      : "No Finance Role";

  function startCallSession() {
    setCallSessionStarted(true);
    setCallIndex(0);
    setCallLog([]);
    setLastCallMessage("");
    setNextAction(null);
    setCallNote("");
    setPaymentAmount("");
    setPaymentMethod("check");
    setPaymentDate(todayIsoDate());
    setPaymentMessage("");
    setFollowUpDate(todayIsoDate());
  }

  function resetCallSession() {
    setCallSessionStarted(false);
    setCallIndex(0);
    setCallLog([]);
    setLastCallMessage("");
    setNextAction(null);
    setCallNote("");
    setPaymentMessage("");
    setFollowUpDate(todayIsoDate());
  }

  async function saveContributionForContact(input: {
    contactId: string;
    amount: number;
    source: PaymentMethod;
    date: string;
  }) {
    const contact = contactById.get(input.contactId);

    if (!contact) {
      throw new Error("Contact not found.");
    }

    const { error: insertError } = await supabase.from("contributions").insert([
      {
        contact_id: input.contactId,
        amount: input.amount,
        source: input.source,
        date: input.date,
        organization_id: contact.organization_id ?? null,
      },
    ]);

    if (insertError) throw insertError;

    const currentDonationTotal =
      contributionTotalByContact.get(input.contactId) ??
      toNumber(contact.donation_total);

    const nextDonationTotal = currentDonationTotal + input.amount;

    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        donation_total: nextDonationTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.contactId);

    if (updateError) throw updateError;
  }

  async function recordActiveCallPayment() {
    if (!activeCallTarget) return;

    const amount = toNumber(paymentAmount || activeCallTarget.amount);

    setPaymentMessage("");

    if (amount <= 0) {
      setPaymentMessage("Enter a valid payment amount.");
      return;
    }

    try {
      await saveContributionForContact({
        contactId: activeCallTarget.contactId,
        amount,
        source: paymentMethod,
        date: paymentDate || todayIsoDate(),
      });

      setPaymentAmount("");
      setPaymentMessage(
        `${currency.format(amount)} ${paymentMethod} payment saved for ${activeCallTarget.contactName}.`,
      );

      await loadFinanceRecords();
    } catch (error: any) {
      setPaymentMessage(error?.message || "Payment did not save.");
    }
  }

  async function recordPledgePayment() {
    if (!activePledge) return;

    const amount = toNumber(pledgePaymentAmount || activePledge.remaining);

    setPledgeMessage("");

    if (amount <= 0) {
      setPledgeMessage("Enter a valid pledge payment amount.");
      return;
    }

    try {
      await saveContributionForContact({
        contactId: activePledge.contactId,
        amount,
        source: pledgePaymentMethod,
        date: pledgePaymentDate || todayIsoDate(),
      });

      const fulfilled = activePledge.amountFulfilled + amount;
      const converted = fulfilled >= activePledge.amount;

      const { error: pledgeError } = await supabase
        .from("pledges")
        .update({
          amount_fulfilled: Math.min(fulfilled, activePledge.amount),
          status: converted ? "converted" : activePledge.status || "follow_up",
        })
        .eq("id", activePledge.id);

      if (pledgeError) throw pledgeError;

      const { error: contactError } = await supabase
        .from("contacts")
        .update({
          pledge_amount: converted
            ? 0
            : Math.max(activePledge.amount - fulfilled, 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activePledge.contactId);

      if (contactError) throw contactError;

      setPledgePaymentAmount("");
      setPledgeMessage(
        converted
          ? `${currency.format(amount)} saved and pledge marked converted.`
          : `${currency.format(amount)} saved against pledge.`,
      );

      await loadFinanceRecords();
    } catch (error: any) {
      setPledgeMessage(error?.message || "Pledge payment did not save.");
    }
  }

  async function saveComplianceDraft() {
    if (!activeCompliance) return;

    setComplianceMessage("");

    try {
      const nextFullName = [
        complianceDraft.first_name.trim(),
        complianceDraft.last_name.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: complianceDraft.first_name.trim() || null,
          last_name: complianceDraft.last_name.trim() || null,
          full_name: nextFullName || null,
          street: complianceDraft.street.trim() || null,
          address: complianceDraft.street.trim() || null,
          city: complianceDraft.city.trim() || null,
          state: complianceDraft.state.trim() || null,
          zip: complianceDraft.zip.trim() || null,
          employer: complianceDraft.employer.trim() || null,
          occupation: complianceDraft.occupation.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeCompliance.contactId);

      if (error) throw error;

      setComplianceMessage("Compliance fields saved.");
      await loadFinanceRecords();
    } catch (error: any) {
      setComplianceMessage(error?.message || "Compliance fields did not save.");
    }
  }

  async function advanceCallSession(
    outcome: CallOutcome,
    defaultNote?: string,
    amountOverride?: number,
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
          entryAmount,
        )}. Log payment when collected, or keep them in pledge follow-up.`,
      );
    } else if (outcome === "follow_up") {
      setLastCallMessage(
        `Follow-up scheduled for ${activeCallTarget.contactName} on ${followUpDate}.`,
      );
    } else if (outcome === "wrong_time") {
      setLastCallMessage(
        `${activeCallTarget.contactName} asked for a better time. Follow-up target: ${followUpDate}.`,
      );
    } else if (outcome === "no_answer") {
      setLastCallMessage(
        `No answer from ${activeCallTarget.contactName}. Logged and moving to next target.`,
      );
    } else {
      setLastCallMessage(
        `Call completed for ${activeCallTarget.contactName}. Logged and moving forward.`,
      );
    }

    setNextAction(
      buildNextActionPlan(
        outcome,
        activeCallTarget.contactName,
        followUpDate,
        entryAmount,
      ),
    );

    setCallNote("");
    setPaymentMessage("");
    setPaymentAmount("");
    setCallIndex((current) => current + 1);
  }

  function openPledge(pledge: FocusPledge) {
    setActivePledgeId(pledge.id);
    setPledgePaymentAmount(String(pledge.remaining || ""));
    setPledgePaymentMethod("check");
    setPledgePaymentDate(todayIsoDate());
    setPledgeMessage("");
  }

  function openCompliance(item: ComplianceItem) {
    const contact = item.contact;

    setActiveComplianceId(item.id);
    setComplianceDraft({
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      street: contact.street || contact.address || "",
      city: contact.city || "",
      state: contact.state || "",
      zip: contact.zip || "",
      employer: contact.employer || "",
      occupation: contact.occupation || "",
    });
    setComplianceMessage("");
  }

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
      <section
        className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-6 text-white shadow-sm transition-colors duration-300 lg:p-8 ${orgTheme.heroGradient}`}
      >
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

      {hasFinanceDirector && callTargets.length > 0 ? (
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
                Aether is routing live pledge pressure and donor opportunity into execution before normal call flow.
              </p>

              <div className="mt-4">
                <Link
                  href="/dashboard/finance/jackpot"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                >
                  Open Jackpot Queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs text-slate-500">Latent Value</p>
                <p className="mt-2 text-xl font-semibold text-amber-800">
                  {currency.format(callTargets.reduce((sum, target) => sum + target.amount, 0))}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs text-slate-500">Priority Donors</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {callTargets.filter((target) => target.priority === "high").length}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-xs text-slate-500">Open Pledges</p>
                <p className="mt-2 text-xl font-semibold text-rose-700">
                  {openPledges.length}
                </p>
              </div>
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
              Call, log outcomes, and record payments directly back to contact profiles.
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
                disabled={loadingTargets || callTargets.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PhoneCall className="h-4 w-4" />
                {loadingTargets
                  ? "Loading Targets..."
                  : callTargets.length === 0
                    ? "No Targets Available"
                    : "Start Call Session"}
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
                            activeCallTarget.priority,
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
                          <p className="text-xs text-slate-400">Suggested Ask</p>
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
                          Script
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {activeCallTarget.script}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                          Record Payment
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                          <input
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder={String(activeCallTarget.amount)}
                            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                          />

                          <select
                            value={paymentMethod}
                            onChange={(e) =>
                              setPaymentMethod(e.target.value as PaymentMethod)
                            }
                            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="check">Check</option>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                          </select>

                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                          />

                          <button
                            onClick={recordActiveCallPayment}
                            className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800"
                          >
                            Save Payment
                          </button>
                        </div>
                        {paymentMessage ? (
                          <p className="mt-3 text-sm font-medium text-emerald-800">
                            {paymentMessage}
                          </p>
                        ) : null}
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
                                "Follow-up scheduled",
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
                                "Requested better time",
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
                    nextAction.category,
                  )}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        nextAction.priority,
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
                <p className="text-sm font-medium text-slate-500">Call Log</p>

                <div className="mt-3 space-y-2">
                  {callLog.length === 0 ? (
                    <p className="text-sm text-slate-500">No calls logged yet.</p>
                  ) : (
                    callLog.map((entry) => (
                      <div
                        key={entry.targetId + entry.outcome}
                        className={`rounded-xl border px-3 py-2 text-xs ${callOutcomeTone(
                          entry.outcome,
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
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
            {openPledges.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {loadingTargets
                  ? "Loading finance pledge actions..."
                  : "No open pledges are available yet."}
              </div>
            ) : null}

            {openPledges.map((pledge) => {
              const isActive = activePledge?.id === pledge.id;

              return (
                <div
                  key={pledge.id}
                  className={`rounded-2xl border p-4 ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        pledge.priority,
                      )}`}
                    >
                      {pledge.priority}
                    </span>
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      pledge
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    Collect {pledge.contactName} pledge
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {currency.format(pledge.remaining)} remaining from{" "}
                    {currency.format(pledge.amount)} pledged.
                  </p>

                  {isActive ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">
                        Pledge Payment
                      </p>

                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <input
                          value={pledgePaymentAmount}
                          onChange={(e) => setPledgePaymentAmount(e.target.value)}
                          placeholder={String(pledge.remaining)}
                          className="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />

                        <select
                          value={pledgePaymentMethod}
                          onChange={(e) =>
                            setPledgePaymentMethod(e.target.value as PaymentMethod)
                          }
                          className="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        >
                          <option value="check">Check</option>
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>

                        <input
                          type="date"
                          value={pledgePaymentDate}
                          onChange={(e) => setPledgePaymentDate(e.target.value)}
                          className="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={recordPledgePayment}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                        >
                          Save + Apply to Pledge
                        </button>
                        <Link
                          href={`/dashboard/contacts/${pledge.contactId}`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Open Contact
                        </Link>
                        <button
                          onClick={() => setActivePledgeId(null)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      </div>

                      {pledgeMessage ? (
                        <p className="mt-3 text-sm font-medium text-emerald-700">
                          {pledgeMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openPledge(pledge)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        Collect Pledge
                      </button>
                      <Link
                        href={`/dashboard/contacts/${pledge.contactId}`}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View Record
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Compliance Lane
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Clear Export Fields
              </h2>
            </div>
            <Landmark className="h-5 w-5 text-amber-600" />
          </div>

          <div className="space-y-4">
            {complianceItems.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-600">
                No live finance compliance actions are available yet.
              </div>
            ) : null}

            {complianceItems.map((item) => {
              const isActive = activeCompliance?.id === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    isActive
                      ? "border-amber-300 bg-white"
                      : "border-amber-200 bg-white/80"
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(
                        item.priority,
                      )}`}
                    >
                      {item.priority}
                    </span>
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      compliance
                    </span>
                  </div>

                  <p className="mt-3 font-semibold text-slate-900">
                    Fix {item.contactName} compliance data
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {currency.format(item.amount)} contributed. Missing:{" "}
                    {item.missingFields.join(", ")}.
                  </p>

                  {isActive ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-amber-700">
                        Compliance Editor
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          value={complianceDraft.first_name}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              first_name: e.target.value,
                            }))
                          }
                          placeholder="First name"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          value={complianceDraft.last_name}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              last_name: e.target.value,
                            }))
                          }
                          placeholder="Last name"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          value={complianceDraft.street}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              street: e.target.value,
                            }))
                          }
                          placeholder="Street / full address line"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm sm:col-span-2"
                        />

                        <input
                          value={complianceDraft.city}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              city: e.target.value,
                            }))
                          }
                          placeholder="City"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          value={complianceDraft.state}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              state: e.target.value,
                            }))
                          }
                          placeholder="State"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          value={complianceDraft.zip}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              zip: e.target.value,
                            }))
                          }
                          placeholder="Zip"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          value={complianceDraft.employer}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              employer: e.target.value,
                            }))
                          }
                          placeholder="Employer"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm"
                        />

                        <input
                          value={complianceDraft.occupation}
                          onChange={(e) =>
                            setComplianceDraft((current) => ({
                              ...current,
                              occupation: e.target.value,
                            }))
                          }
                          placeholder="Occupation"
                          className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm sm:col-span-2"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={saveComplianceDraft}
                          className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-700"
                        >
                          Save Compliance Fields
                        </button>
                        <Link
                          href={`/dashboard/contacts/${item.contactId}`}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Open Contact
                        </Link>
                        <button
                          onClick={() => setActiveComplianceId(null)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      </div>

                      {complianceMessage ? (
                        <p className="mt-3 text-sm font-medium text-amber-800">
                          {complianceMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openCompliance(item)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        Fix Compliance
                      </button>
                      <Link
                        href={`/dashboard/contacts/${item.contactId}`}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Review Record
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            openPledges.length > 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">Pledge</p>
            <HandCoins className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-2 text-xl font-semibold text-emerald-900">
            {openPledges.length}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Collection and follow-up actions
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            complianceItems.length > 0
              ? "border-rose-200 bg-rose-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-800">Compliance</p>
            <CheckCircle2 className="h-5 w-5 text-rose-700" />
          </div>
          <p className="mt-2 text-xl font-semibold text-rose-900">
            {complianceItems.length}
          </p>
          <p className="mt-1 text-xs text-rose-800">
            Missing data and export-readiness work
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">Payments</p>
            <FileSpreadsheet className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {contributions.length}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Saved contribution records
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            callTargets.length > 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-800">
              Call Targets
            </p>
            <Phone className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-2 text-xl font-semibold text-emerald-900">
            {callTargets.length}
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            {loadingTargets
              ? "Loading live finance targets"
              : "Native finance call session queue"}
          </p>
        </div>
      </section>
    </div>
  );
}
