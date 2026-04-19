import { supabase } from "@/lib/supabase";

export type ContributionRecord = {
  id: string;
  amount: number;
  method: "online" | "check" | "cash";
  date: string;
  compliant: boolean;
  employer?: string | null;
  occupation?: string | null;
  notes?: string | null;
};

export type PledgeRecord = {
  id: string;
  amount: number;
  status: "pledged" | "follow_up" | "converted";
  created_at: string;
  converted_at?: string | null;
  notes?: string | null;
};

export type FinanceContactSeed = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  phone: string;
  candidateApproved?: boolean;
  contributions: ContributionRecord[];
  pledges: PledgeRecord[];
  lastContact: string;
};

export type FinanceCallTarget = {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
  amount: number;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedAsk: string;
  script: string;
  status: "pledged" | "follow_up" | "reconnect";
  lastContact: string;
};

export type FinanceDbContact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  owner_name?: string | null;
};

function generateMockUuid(seed: string) {
  return `00000000-0000-4000-8000-${seed.padEnd(12, "0").slice(0, 12)}`;
}

export const financeContactSeeds: FinanceContactSeed[] = [
  {
    id: generateMockUuid("c1"),
    name: "Sarah Mitchell",
    city: "Chicago",
    state: "IL",
    phone: "(773) 555-0108",
    candidateApproved: true,
    lastContact: "21 days ago",
    contributions: [
      {
        id: "ctrb-1",
        amount: 2500,
        method: "online",
        date: "2026-04-01",
        compliant: true,
        employer: "Mitchell Advisory",
        occupation: "Consultant",
        notes: "High-capacity contact",
      },
    ],
    pledges: [],
  },
  {
    id: generateMockUuid("c2"),
    name: "James Carter",
    city: "Naperville",
    state: "IL",
    phone: "(630) 555-0131",
    candidateApproved: false,
    lastContact: "9 days ago",
    contributions: [
      {
        id: "ctrb-2",
        amount: 1000,
        method: "check",
        date: "2026-04-02",
        compliant: false,
        employer: null,
        occupation: null,
        notes: "Missing employer and occupation",
      },
    ],
    pledges: [],
  },
  {
    id: generateMockUuid("c3"),
    name: "Alicia Stone",
    city: "Evanston",
    state: "IL",
    phone: "(847) 555-0182",
    candidateApproved: true,
    lastContact: "5 days ago",
    contributions: [
      {
        id: "ctrb-3",
        amount: 500,
        method: "cash",
        date: "2026-04-03",
        compliant: true,
        employer: "Stone Design",
        occupation: "Designer",
        notes: null,
      },
    ],
    pledges: [],
  },
  {
    id: generateMockUuid("c4"),
    name: "Michael Ross",
    city: "Aurora",
    state: "IL",
    phone: "(312) 555-0144",
    candidateApproved: false,
    lastContact: "2 days ago",
    contributions: [],
    pledges: [
      {
        id: "plg-1",
        amount: 3200,
        status: "pledged",
        created_at: "2026-04-04",
        converted_at: null,
        notes: "Needs follow-up to collect pledge",
      },
    ],
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildSuggestedAsk(contact: FinanceContactSeed, amount: number) {
  const activePledge = contact.pledges.find(
    (pledge) => pledge.status === "pledged" || pledge.status === "follow_up"
  );

  const nonCompliantContribution = contact.contributions.find(
    (contribution) => !contribution.compliant
  );

  if (activePledge) {
    return `Confirm the full ${formatCurrency(amount)} today and lock collection timing.`;
  }

  if (nonCompliantContribution) {
    return "Confirm support and gather updated donor details on the call.";
  }

  return `Thank them and ask for a ${formatCurrency(amount)} commitment.`;
}

function buildScript(contact: FinanceContactSeed, amount: number) {
  const activePledge = contact.pledges.find(
    (pledge) => pledge.status === "pledged" || pledge.status === "follow_up"
  );

  const nonCompliantContribution = contact.contributions.find(
    (contribution) => !contribution.compliant
  );

  if (activePledge) {
    return `${contact.name}, thanks again for backing the campaign. I’m reaching out to confirm your ${formatCurrency(amount)} pledge and lock in collection today so we can keep finance clean and moving.`;
  }

  if (nonCompliantContribution) {
    return `${contact.name}, I’m following up to thank you for your support and quickly confirm a couple of donor record details so we can keep everything accurate on our side.`;
  }

  return `${contact.name}, thank you again for your support. I wanted to reconnect because we’re in a tight push and ask whether you’d consider a ${formatCurrency(amount)} commitment to help close this stretch.`;
}

function deriveSeedCallTargets(
  contacts: FinanceContactSeed[] = financeContactSeeds
): FinanceCallTarget[] {
  const targets: FinanceCallTarget[] = [];

  contacts.forEach((contact) => {
    const activePledge = contact.pledges.find(
      (pledge) => pledge.status === "pledged" || pledge.status === "follow_up"
    );

    const nonCompliantContribution = contact.contributions.find(
      (contribution) => !contribution.compliant
    );

    const contributionTotal = contact.contributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );

    if (activePledge) {
      targets.push({
        id: `call-${contact.id}-pledge`,
        contactId: contact.id,
        contactName: contact.name,
        phone: contact.phone,
        city: contact.city ?? "Unknown",
        state: contact.state ?? "IL",
        amount: activePledge.amount,
        priority: "high",
        reason: "Active high-value pledge needs direct collection",
        suggestedAsk: buildSuggestedAsk(contact, activePledge.amount),
        script: buildScript(contact, activePledge.amount),
        status: activePledge.status,
        lastContact: contact.lastContact,
      });
      return;
    }

    if (nonCompliantContribution) {
      targets.push({
        id: `call-${contact.id}-compliance`,
        contactId: contact.id,
        contactName: contact.name,
        phone: contact.phone,
        city: contact.city ?? "Unknown",
        state: contact.state ?? "IL",
        amount: nonCompliantContribution.amount,
        priority: "medium",
        reason:
          "Donation exists, but relationship should be maintained during compliance cleanup",
        suggestedAsk: buildSuggestedAsk(contact, nonCompliantContribution.amount),
        script: buildScript(contact, nonCompliantContribution.amount),
        status: "follow_up",
        lastContact: contact.lastContact,
      });
      return;
    }

    if (contributionTotal >= 2000) {
      targets.push({
        id: `call-${contact.id}-reconnect`,
        contactId: contact.id,
        contactName: contact.name,
        phone: contact.phone,
        city: contact.city ?? "Unknown",
        state: contact.state ?? "IL",
        amount: contributionTotal,
        priority: "high",
        reason: "High-capacity donor should be moved into a fresh ask",
        suggestedAsk: buildSuggestedAsk(contact, contributionTotal),
        script: buildScript(contact, contributionTotal),
        status: "reconnect",
        lastContact: contact.lastContact,
      });
      return;
    }

    if (contributionTotal >= 500) {
      targets.push({
        id: `call-${contact.id}-followup`,
        contactId: contact.id,
        contactName: contact.name,
        phone: contact.phone,
        city: contact.city ?? "Unknown",
        state: contact.state ?? "IL",
        amount: Math.max(contributionTotal, 500),
        priority: "medium",
        reason: "Recent donor is warm and worth a near-term follow-up ask",
        suggestedAsk: buildSuggestedAsk(contact, Math.max(contributionTotal, 500)),
        script: buildScript(contact, Math.max(contributionTotal, 500)),
        status: "follow_up",
        lastContact: contact.lastContact,
      });
    }
  });

  return targets.sort((a, b) => {
    const priorityRank = { high: 3, medium: 2, low: 1 };
    const byPriority = priorityRank[b.priority] - priorityRank[a.priority];
    if (byPriority !== 0) return byPriority;
    return b.amount - a.amount;
  });
}

function fullName(contact: FinanceDbContact) {
  const name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  return name || contact.email || "Unnamed Contact";
}

function buildLiveSuggestedAsk(contact: FinanceDbContact, amount: number) {
  return `Thank them for their support and ask for ${formatCurrency(amount)} to move this finance push forward.`;
}

function buildLiveScript(contact: FinanceDbContact, amount: number) {
  return `${fullName(contact)}, thanks again for your support. I’m reaching out because we’re in an active push and wanted to ask whether you’d consider ${formatCurrency(amount)} today to help us close strong.`;
}

function buildLiveReason(contact: FinanceDbContact, amount: number) {
  if ((contact.owner_name || "").trim()) {
    return `Assigned contact with callable information and a suggested ask of ${formatCurrency(amount)}.`;
  }

  return `Callable contact with usable finance profile and a suggested ask of ${formatCurrency(amount)}.`;
}

function buildLivePriority(contact: FinanceDbContact) {
  if ((contact.owner_name || "").trim()) return "high" as const;
  if (contact.city && contact.state) return "medium" as const;
  return "low" as const;
}

function buildLiveAmount(contact: FinanceDbContact) {
  if ((contact.owner_name || "").trim()) return 1500;
  if (contact.city && contact.state) return 1000;
  return 500;
}

export async function getLiveFinanceCallTargets(): Promise<FinanceCallTarget[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, city, state, owner_name")
    .not("phone", "is", null)
    .order("last_name", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Failed to load live finance contacts:", error);
    return deriveSeedCallTargets();
  }

  const contacts = (data as FinanceDbContact[] | null)?.filter(
    (contact) => !!contact.id && !!contact.phone
  ) ?? [];

  if (contacts.length === 0) {
    return deriveSeedCallTargets();
  }

  const targets = contacts.map((contact) => {
    const amount = buildLiveAmount(contact);

    return {
      id: `call-${contact.id}`,
      contactId: contact.id,
      contactName: fullName(contact),
      phone: contact.phone || "—",
      city: contact.city || "Unknown",
      state: contact.state || "IL",
      amount,
      priority: buildLivePriority(contact),
      reason: buildLiveReason(contact, amount),
      suggestedAsk: buildLiveSuggestedAsk(contact, amount),
      script: buildLiveScript(contact, amount),
      status: "reconnect" as const,
      lastContact: "Live contact record",
    };
  });

  return targets.sort((a, b) => {
    const priorityRank = { high: 3, medium: 2, low: 1 };
    const byPriority = priorityRank[b.priority] - priorityRank[a.priority];
    if (byPriority !== 0) return byPriority;
    return b.amount - a.amount;
  });
}

export function getFinanceCallTargets(
  contacts: FinanceContactSeed[] = financeContactSeeds
): FinanceCallTarget[] {
  return deriveSeedCallTargets(contacts);
}