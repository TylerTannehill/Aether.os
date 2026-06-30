import type { AbeBriefing } from "@/lib/abe/abe-briefing";
import type { AbeDepartment } from "@/lib/abe/abe-memory";
import type { getOrgContextForDepartment } from "@/lib/abe/abe-org-layer";

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

type PrintAssetRow = {
  id: string;
  name: string;
  type: "mailer" | "door_hanger" | "yard_sign" | "lit_piece" | "digital_asset";
  status: "design" | "candidate_review" | "approved" | "ordered" | "delivered";
  owner: string;
  candidateApprovedDate?: string | null;
  expectedDelivery?: string | null;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type InventoryRow = {
  id: string;
  item: string;
  onHand: number;
  reserved: number;
  reorderAt: number;
  region: string;
  dailyUsage?: number;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type PrintOrderRow = {
  id: string;
  vendor: string;
  item: string;
  quantity: number;
  status: "queued" | "in_production" | "shipped" | "delivered";
  eta?: string | null;
  linkedTurf?: string;
  linkedUseCase?: string;
  unblocks?: string;
};

type PrintFocusTask = {
  id: string;
  title: string;
  type: "approval" | "inventory" | "delivery";
  priority: "high" | "medium" | "low";
  summary: string;
  linkedTurf?: string;
  linkedUseCase?: string;
};

type PrintReadyAsset = {
  id: string;
  assetName: string;
  status: "approved" | "ordered" | "delivered";
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintInventoryAction = {
  id: string;
  item: string;
  amount: number;
  region: string;
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintDeliveryUnlock = {
  id: string;
  item: string;
  vendor: string;
  eta: string;
  linkedTurf?: string;
  linkedUseCase?: string;
  updatedAt: string;
};

type PrintOrgContext = ReturnType<typeof getOrgContextForDepartment>;

export type PrintBriefingInput = {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  assetRows: PrintAssetRow[];
  inventoryRows: InventoryRow[];
  orderRows: PrintOrderRow[];
  readyAssets: PrintReadyAsset[];
  inventoryActions: PrintInventoryAction[];
  deliveryUnlocks: PrintDeliveryUnlock[];
  mostExposedInventory:
    | (InventoryRow & { available: number; daysRemaining: number | null })
    | undefined;
  selectedTask: PrintFocusTask | null;
  orgContext?: PrintOrgContext;
};

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

export function buildPrintBriefing(input: PrintBriefingInput): AbeBriefing {
  const candidateReviewCount = input.assetRows.filter(
    (asset) => asset.status === "candidate_review"
  ).length;

  const queuedOrders = input.orderRows.filter(
    (order) => order.status === "queued" || order.status === "in_production"
  ).length;

  const strongest: AbeDepartment =
    input.readyAssets.length > 0 || input.deliveryUnlocks.length > 0
      ? "print"
      : "field";

  const weakest: AbeDepartment =
    candidateReviewCount > 0 ||
    (input.mostExposedInventory?.daysRemaining !== null &&
      (input.mostExposedInventory?.daysRemaining ?? 999) <= 5)
      ? "print"
      : "field";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? "print"
      : input.demoDepartment === "print"
      ? "print"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.deliveryUnlocks.length > 0 || input.readyAssets.length > 0
      ? "field"
      : "print";

  let health = "Stable overall";
  if (candidateReviewCount > 0 || queuedOrders > 1) {
    health = "Pressure is rising";
  } else if (input.readyAssets.length > 0 || input.deliveryUnlocks.length > 0) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (candidateReviewCount > 0) {
    campaignStatus = "Approval pressure is active";
  } else if (
    input.mostExposedInventory?.daysRemaining !== null &&
    (input.mostExposedInventory?.daysRemaining ?? 999) <= 5
  ) {
    campaignStatus = "Inventory pressure is active";
  } else if (input.deliveryUnlocks.length > 0) {
    campaignStatus = "Stable with delivery opportunity";
  }

  let whyNow =
    "Print is moving materials, but timing discipline across approvals, inventory, and delivery is what determines whether the lane stays useful.";

  if (candidateReviewCount > 0) {
    whyNow =
      "Approval drag is the immediate constraint, which means print needs faster sign-off before production timing slips further.";
  } else if (
    input.mostExposedInventory?.daysRemaining !== null &&
    (input.mostExposedInventory?.daysRemaining ?? 999) <= 5
  ) {
    whyNow =
      "Inventory pressure is building around the most exposed stock position, so print needs protection before field demand creates avoidable shortages.";
  } else if (input.deliveryUnlocks.length > 0) {
    whyNow =
      "Delivered and in-flight materials are unlocking downstream execution, so print should keep handoff timing tight while the lane is moving.";
  }

  const whyNowModifiers: string[] = [];

  if (input.orgContext?.departmentIsPressureLeader) {
    whyNowModifiers.push("Print is acting as a broader campaign constraint lane right now.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    whyNowModifiers.push("Print is carrying more campaign readiness than usual.");
  } else if (input.orgContext?.imbalanceDetected) {
    whyNowModifiers.push("Cross-lane imbalance is shaping how this print signal should be read.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  let supportText =
    input.role === "admin"
      ? "Use Print Focus to protect timing and reinforce readiness."
      : input.role === "director"
      ? "Use Print Focus to sequence approvals and delivery cleanly."
      : "Finish the next print action cleanly and keep materials moving.";

  if (input.orgContext?.orgSupportLine) {
    supportText = `${supportText} ${input.orgContext.orgSupportLine}`;
  }

  const actions: string[] = [];

  if (candidateReviewCount > 0) {
    actions.push("Push candidate approvals faster before production timing slips.");
  }

  if (
    input.mostExposedInventory?.daysRemaining !== null &&
    (input.mostExposedInventory?.daysRemaining ?? 999) <= 5
  ) {
    actions.push("Protect the most exposed inventory position before field drawdown hits.");
  }

  if (input.deliveryUnlocks.length > 0 || queuedOrders > 0) {
    actions.push("Confirm delivery timing so downstream execution is not waiting on print.");
  } else {
    actions.push("Keep the next print action tight and move to the next material signal.");
  }

  if (input.orgContext?.departmentIsPressureLeader) {
    actions.push("Treat print timing like a campaign-level constraint until this lane steadies.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    actions.push("Use print readiness to support the broader campaign while this lane is carrying momentum.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next print action tight and move to the next material signal.");
  }

  return {
    health,
    strongest,
    weakest,
    primaryLane,
    opportunityLane,
    campaignStatus,
    whyNow,
    supportText,
    actions: actions
      .filter((action, index, array) => array.indexOf(action) === index)
      .slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal:
      input.deliveryUnlocks.length > 0
        ? "PRINT delivery timing is directly shaping downstream FIELD readiness."
        : undefined,
  };
}
