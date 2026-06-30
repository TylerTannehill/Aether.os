import { AbeBriefing } from "@/lib/abe/abe-briefing";
import { AbeDepartment } from "@/lib/abe/abe-memory";
import { getOrgContextForDepartment } from "@/lib/abe/abe-org-layer";

type DemoRole = "admin" | "director" | "general_user";
type DemoDepartment = "outreach" | "finance" | "field" | "digital" | "print";

type TurfRow = {
  id: string;
  name: string;
  region: string;
  doors: number;
  conversations: number;
  ids: number;
  completion: number;
  owner: string;
  linkedListId?: string;
  linkedListName?: string;
};

type CanvasserRow = {
  id: string;
  name: string;
  doors: number;
  conversations: number;
  ids: number;
  shifts: number;
};

type GeneratedFieldList = {
  id: string;
  name: string;
  source: string;
  created: string;
};

function applyWhyNowGovernor(base: string, modifiers: string[]) {
  const cleanModifiers = modifiers.filter(Boolean);
  if (!cleanModifiers.length) return base;
  return `${base} ${cleanModifiers[0]}`;
}

export function buildFieldBriefing(input: {
  role: DemoRole;
  demoDepartment: DemoDepartment;
  turfRows: TurfRow[];
  canvasserRows: CanvasserRow[];
  generatedLists: GeneratedFieldList[];
  averageCompletion: number;
  topLine: {
    doors: number;
    conversations: number;
    ids: number;
    completion: number;
  };
  fieldCommandSignal: {
    title: string;
    detail: string;
    priority: "high" | "low";
    category: "follow_up" | "turf" | "review";
  };
  orgContext?: ReturnType<typeof getOrgContextForDepartment>;
}): AbeBriefing {
  const highPressureTurfs = input.turfRows.filter((turf) => turf.completion < 60);
  const highCompletionTurfs = input.turfRows.filter((turf) => turf.completion >= 75);
  const highIdCanvassers = input.canvasserRows.filter((row) => row.ids >= 40);

  const weakest: AbeDepartment =
    input.averageCompletion < 65
      ? "field"
      : input.generatedLists.length > 0
      ? "outreach"
      : "field";

  const strongest: AbeDepartment =
    input.topLine.ids >= 300 || highCompletionTurfs.length >= 2 ? "field" : "outreach";

  const primaryLane: AbeDepartment =
    input.role === "admin"
      ? input.generatedLists.length > 0
        ? "field"
        : "field"
      : input.demoDepartment === "field"
      ? "field"
      : input.demoDepartment;

  const opportunityLane: AbeDepartment =
    input.generatedLists.length > 0 ? "outreach" : "field";

  let health = "Stable overall";
  if (input.averageCompletion < 55) {
    health = "Pressure is rising";
  } else if (input.averageCompletion >= 72 && input.topLine.ids >= 300) {
    health = "Momentum building";
  }

  let campaignStatus = "Stable overall";
  if (input.averageCompletion < 55) {
    campaignStatus = "Completion risk is building";
  } else if (input.generatedLists.length > 0) {
    campaignStatus = "Stable with follow-up opportunity";
  } else if (input.averageCompletion >= 70) {
    campaignStatus = "Stable with opportunity";
  }

  let whyNow =
    "Field output is moving, but the lane needs clean completion and fast conversion of good conversations.";

  if (input.generatedLists.length > 0) {
    whyNow =
      "Field is no longer just producing conversations — it is creating follow-up value that should move into outreach while turf completion stays on pace.";
  } else if (input.averageCompletion < 60) {
    whyNow =
      "Lagging turf completion is starting to drag on the lane, which makes deployment and finishing pressure the immediate issue.";
  } else if (highIdCanvassers.length >= 2) {
    whyNow =
      "The lane has real production strength right now, so the priority is converting strong canvassing output into completion and follow-up momentum.";
  }

  const whyNowModifiers:string[] = [];

  if (input.orgContext?.departmentIsPressureLeader) {
    whyNowModifiers.push("Field is carrying the most campaign-wide pressure right now.");
  } else if (input.orgContext?.departmentIsMomentumLeader) {
    whyNowModifiers.push("Field is acting as a steadier campaign-wide support lane.");
  } else if (input.orgContext?.imbalanceDetected) {
    whyNowModifiers.push("Cross-lane imbalance is shaping how this field signal should be read.");
  }

  whyNow = applyWhyNowGovernor(whyNow, whyNowModifiers);

  const baseSupportText =
    input.role === "admin"
      ? "Use Field Focus to tighten completion and protect momentum."
      : input.role === "director"
      ? "Use Field Focus to tighten deployment and move follow-up."
      : "Finish active turf and keep next actions simple.";

  const supportText = [baseSupportText, input.orgContext?.orgSupportLine]
    .filter(Boolean)
    .join(" ");

  const actions: string[] = [];

  if (input.averageCompletion < 60) {
    actions.push("Finish the lagging turf before completion drag spreads.");
  }

  if (highIdCanvassers.length >= 2) {
    actions.push("Route your strongest canvassers into the highest-ID opportunity.");
  }

  if (input.generatedLists.length > 0) {
    actions.push("Move new field-generated follow-up lists into outreach quickly.");
  } else {
    actions.push("Convert the strongest recent conversations into follow-up actions.");
  }

  while (actions.length < (input.role === "admin" ? 3 : 2)) {
    actions.push("Keep the next field action tight and move to the next lane signal.");
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
    actions: actions.slice(0, input.role === "admin" ? 3 : 2),
    crossDomainSignal:
      input.generatedLists.length > 0
        ? "FIELD is generating follow-up work that OUTREACH should absorb quickly."
        : input.fieldCommandSignal.category === "turf"
        ? "FIELD completion is the primary constraint before downstream conversion improves."
        : undefined,
  };
}

