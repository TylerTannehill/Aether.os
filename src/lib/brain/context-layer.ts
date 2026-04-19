export type BrainActionSource =
  | "routing"
  | "fallback"
  | "suggestion"
  | "task"
  | "manual"
  | "system";

export type BrainDepartment =
  | "executive"
  | "field"
  | "digital"
  | "finance"
  | "outreach"
  | "contacts"
  | "print"
  | "general"
  | "unknown";

export type BrainOwnerLevel =
  | "admin"
  | "director"
  | "user"
  | "system"
  | "unknown";

export type BrainFailureType =
  | "no_owner"
  | "missing_contact_data"
  | "no_rule_match"
  | "manual_override"
  | "stale_data"
  | "blocked_dependency"
  | "unknown"
  | null;

export type BrainIssueType =
  | "opportunity"
  | "warning"
  | "failure"
  | "follow_up"
  | "execution"
  | "review"
  | "unknown";

export type BrainPriorityHint =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type RawBrainItem = {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  source?: string | null;
  department?: string | null;
  team?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  level?: string | null;
  fallbackReason?: string | null;
  reason?: string | null;
  category?: string | null;
  metric?: string | null;
  metricKey?: string | null;
  impactArea?: string | null;
  actionType?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  autoExecutable?: boolean | null;
  manualOnly?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

export type BrainContext = {
  itemId: string;
  label: string;
  description: string | null;

  source: BrainActionSource;
  department: BrainDepartment;
  ownerLevel: BrainOwnerLevel;

  failureType: BrainFailureType;
  issueType: BrainIssueType;
  priorityHint: BrainPriorityHint;

  relatedMetric: string | null;
  status: string | null;

  hasOwner: boolean;
  hasFallback: boolean;
  isAutoExecutable: boolean;
  isManualOnly: boolean;
  isStale: boolean;

  dueAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  tags: string[];
  raw: RawBrainItem;
};

const DEFAULT_ITEM_ID_PREFIX = "brain-item";

function safeLower(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function safeText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function buildFallbackId(item: RawBrainItem): string {
  const title = safeLower(item.title).replace(/\s+/g, "-");
  const type = safeLower(item.type).replace(/\s+/g, "-");
  const created = safeLower(item.createdAt).replace(/[^a-z0-9]/g, "");
  return [DEFAULT_ITEM_ID_PREFIX, type || "unknown", title || "untitled", created || "na"]
    .filter(Boolean)
    .join("-");
}

function normalizeSource(item: RawBrainItem): BrainActionSource {
  const value = safeLower(item.source || item.type || item.category);

  if (
    value.includes("fallback") ||
    safeText(item.fallbackReason) ||
    safeLower(item.reason).includes("fallback")
  ) {
    return "fallback";
  }

  if (value.includes("routing") || value.includes("route")) return "routing";
  if (value.includes("suggest")) return "suggestion";
  if (value.includes("task")) return "task";
  if (value.includes("manual")) return "manual";
  if (value.includes("system") || value.includes("auto")) return "system";

  return "task";
}

function normalizeDepartment(item: RawBrainItem): BrainDepartment {
  const value = [
    item.department,
    item.team,
    item.category,
    item.metric,
    item.impactArea,
    item.title,
    item.description,
  ]
    .map((v) => safeLower(v))
    .join(" ");

  if (value.includes("executive") || value.includes("owner signals")) return "executive";
  if (value.includes("field")) return "field";
  if (value.includes("digital") || value.includes("social") || value.includes("content")) return "digital";
  if (value.includes("finance") || value.includes("donor") || value.includes("fundrais")) return "finance";
  if (value.includes("outreach") || value.includes("call time") || value.includes("phone bank")) return "outreach";
  if (value.includes("contact") || value.includes("list")) return "contacts";
  if (value.includes("print")) return "print";
  if (value.includes("general")) return "general";

  return "unknown";
}

function normalizeOwnerLevel(item: RawBrainItem): BrainOwnerLevel {
  const value = [item.ownerRole, item.level, item.type, item.description]
    .map((v) => safeLower(v))
    .join(" ");

  if (value.includes("admin") || value.includes("candidate") || value.includes("campaign manager")) {
    return "admin";
  }

  if (value.includes("director")) return "director";
  if (value.includes("system") || value.includes("auto")) return "system";
  if (value.includes("user") || value.includes("staff") || value.includes("volunteer")) return "user";

  return item.ownerId || item.ownerName ? "user" : "unknown";
}

function normalizeFailureType(item: RawBrainItem): BrainFailureType {
  const value = [item.fallbackReason, item.reason, item.description, item.status]
    .map((v) => safeLower(v))
    .join(" ");

  if (!value.length) return null;
  if (value.includes("no_owner")) return "no_owner";
  if (value.includes("missing_contact_data")) return "missing_contact_data";
  if (value.includes("no_rule_match")) return "no_rule_match";
  if (value.includes("manual_override")) return "manual_override";
  if (value.includes("stale")) return "stale_data";
  if (value.includes("blocked") || value.includes("dependency")) return "blocked_dependency";

  return safeText(item.fallbackReason) || safeLower(item.source).includes("fallback") ? "unknown" : null;
}
function normalizeIssueType(item: RawBrainItem, failureType: BrainFailureType): BrainIssueType {
  const value = [item.type, item.category, item.actionType, item.status, item.title, item.description]
    .map((v) => safeLower(v))
    .join(" ");

  if (failureType) return "failure";
  if (value.includes("opportunity")) return "opportunity";
  if (value.includes("warning") || value.includes("risk")) return "warning";
  if (value.includes("follow")) return "follow_up";
  if (value.includes("execute") || value.includes("automation")) return "execution";
  if (value.includes("review") || value.includes("audit")) return "review";

  return "unknown";
}

function normalizePriorityHint(
  item: RawBrainItem,
  issueType: BrainIssueType,
  failureType: BrainFailureType
): BrainPriorityHint {
  const value = [item.status, item.category, item.title, item.description]
    .map((v) => safeLower(v))
    .join(" ");

  if (failureType === "blocked_dependency") return "high";
  if (failureType && failureType !== "manual_override") return "critical";
  if (value.includes("critical") || value.includes("urgent") || value.includes("immediately")) {
    return "critical";
  }
  if (issueType === "opportunity" && value.includes("high value")) return "high";
  if (issueType === "warning" || issueType === "failure") return "high";
  if (issueType === "execution" || issueType === "follow_up") return "medium";
  if (issueType === "review") return "low";

  return "unknown";
}

function extractRelatedMetric(item: RawBrainItem): string | null {
  return (
    safeText(item.metric) ||
    safeText(item.metricKey) ||
    safeText(item.impactArea) ||
    safeText(item.metadata?.metric as string | undefined) ||
    null
  );
}

function buildTags(args: {
  source: BrainActionSource;
  department: BrainDepartment;
  ownerLevel: BrainOwnerLevel;
  failureType: BrainFailureType;
  issueType: BrainIssueType;
  priorityHint: BrainPriorityHint;
  hasOwner: boolean;
  isAutoExecutable: boolean;
  isManualOnly: boolean;
  isStale: boolean;
}): string[] {
  const tags = [
    `source:${args.source}`,
    `department:${args.department}`,
    `ownerLevel:${args.ownerLevel}`,
    `issue:${args.issueType}`,
    `priorityHint:${args.priorityHint}`,
  ];

  if (args.failureType) tags.push(`failure:${args.failureType}`);
  if (!args.hasOwner) tags.push("owner:missing");
  if (args.isAutoExecutable) tags.push("execution:auto");
  if (args.isManualOnly) tags.push("execution:manual-only");
  if (args.isStale) tags.push("data:stale");

  return tags;
}

function isItemStale(item: RawBrainItem): boolean {
  const updatedAt = safeText(item.updatedAt);
  const createdAt = safeText(item.createdAt);
  const candidate = updatedAt || createdAt;
  if (!candidate) return false;

  const timestamp = new Date(candidate).getTime();
  if (Number.isNaN(timestamp)) return false;

  const ageMs = Date.now() - timestamp;
  const seventyTwoHours = 1000 * 60 * 60 * 72;

  return ageMs > seventyTwoHours;
}

export function enrichBrainItem(item: RawBrainItem): BrainContext {
  const itemId = safeText(item.id) || buildFallbackId(item);
  const label = safeText(item.title) || "Untitled action";
  const description = safeText(item.description);

  const source = normalizeSource(item);
  const department = normalizeDepartment(item);
  const ownerLevel = normalizeOwnerLevel(item);
  const failureType = normalizeFailureType(item);
  const issueType = normalizeIssueType(item, failureType);
  const priorityHint = normalizePriorityHint(item, issueType, failureType);
  const relatedMetric = extractRelatedMetric(item);

  const hasOwner = Boolean(safeText(item.ownerId) || safeText(item.ownerName));
  const hasFallback = Boolean(failureType);
  const isAutoExecutable = Boolean(item.autoExecutable) && !Boolean(item.manualOnly);
  const isManualOnly = Boolean(item.manualOnly);
  const isStale = isItemStale(item);

  const tags = buildTags({
    source,
    department,
    ownerLevel,
    failureType,
    issueType,
    priorityHint,
    hasOwner,
    isAutoExecutable,
    isManualOnly,
    isStale,
  });

  return {
    itemId,
    label,
    description,
    source,
    department,
    ownerLevel,
    failureType,
    issueType,
    priorityHint,
    relatedMetric,
    status: safeText(item.status),
    hasOwner,
    hasFallback,
    isAutoExecutable,
    isManualOnly,
    isStale,
    dueAt: safeText(item.dueAt),
    createdAt: safeText(item.createdAt),
    updatedAt: safeText(item.updatedAt),
    tags,
    raw: item,
  };
}

export function enrichBrainItems(items: RawBrainItem[]): BrainContext[] {
  return items.map(enrichBrainItem);
}