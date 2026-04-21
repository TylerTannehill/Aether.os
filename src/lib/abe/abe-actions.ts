// src/lib/abe/abe-actions.ts

import { AbeDepartment, departmentLabel } from "./abe-memory";

type AbeRole = "admin" | "director" | "general_user";

type ActionVariationInput = {
  role: AbeRole;
  department: AbeDepartment;
  repeatedPressureCount?: number;
  repeatedOpportunityCount?: number;
  repeatedPrimaryCount?: number;
};

function pickVariant(options: string[], seed: number) {
  if (options.length === 0) return "";
  return options[Math.abs(seed) % options.length];
}

function buildSeed(input: ActionVariationInput) {
  return (
    (input.repeatedPressureCount ?? 0) * 3 +
    (input.repeatedOpportunityCount ?? 0) * 5 +
    (input.repeatedPrimaryCount ?? 0) * 7
  );
}

function maybePatternTail(
  repeatedCount: number | undefined,
  variants: string[]
) {
  if (!repeatedCount || repeatedCount < 2) return "";
  return ` ${pickVariant(variants, repeatedCount)}`;
}

function outreachActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const first = [
    "Clear the next layer of follow-up while engagement is still warm.",
    "Work the follow-up queue before interest starts to cool.",
    "Tighten follow-through on the warmest outreach contacts.",
  ];

  const second = [
    "Keep the outreach lane moving while responsiveness is still on your side.",
    "Use the current engagement window before it starts to narrow.",
    "Lean into the strongest conversations while they still have momentum.",
  ];

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This pressure has surfaced more than once now.",
      "This looks a bit more persistent than a one-cycle bump.",
      "It may be worth treating this like a recurring theme.",
    ])}`,
    `${pickVariant(second, seed + 1)}${maybePatternTail(
      input.repeatedOpportunityCount,
      [
        "There may be steadier upside here than the brief first suggests.",
        "The opportunity signal here has stayed healthier than usual.",
        "This lane keeps offering usable movement.",
      ]
    )}`,
  ];
}

function financeActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const first = [
    "Tighten donor follow-through where pledged dollars are still waiting.",
    "Close the gap on pending pledge collection before it drifts.",
    "Give the next round of donor follow-up a little more structure.",
  ];

  const second = [
    "Keep revenue movement steady while the finance lane still has room to stabilize.",
    "Use the current finance momentum before pressure starts to stack.",
    "Give the cleanest collection opportunities attention before they stale out.",
  ];

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This pressure point has shown up repeatedly.",
      "It may be worth treating this as a pattern, not a one-off.",
      "This part of the lane keeps resurfacing in the read.",
    ])}`,
    `${pickVariant(second, seed + 1)}${maybePatternTail(
      input.repeatedOpportunityCount,
      [
        "Finance keeps showing signs of usable stability.",
        "There is still workable momentum here.",
        "This lane keeps offering room to strengthen the overall picture.",
      ]
    )}`,
  ];
}

function fieldActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const first = [
    "Support field completion before uneven coverage turns into drag.",
    "Help the weaker turf areas catch up before pace slips further.",
    "Tighten field follow-through where completion still looks soft.",
  ];

  const second = [
    "Lean into the stronger field pockets while activity is still productive.",
    "Use the current field movement before it starts to flatten.",
    "Keep the best field momentum moving while the lane still feels live.",
  ];

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This softness has stayed visible across more than one read.",
      "The weaker field signal may be lingering a bit.",
      "This looks less temporary than it did at first.",
    ])}`,
    `${pickVariant(second, seed + 1)}${maybePatternTail(
      input.repeatedOpportunityCount,
      [
        "Field keeps showing some repeatable upside.",
        "There is still useful movement here to build around.",
        "This lane may be more durable than a single-cycle spike.",
      ]
    )}`,
  ];
}

function digitalActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const first = [
    "Watch digital sentiment and creative fatigue before they compound.",
    "Refresh the weaker digital pressure points before efficiency softens further.",
    "Give the less stable digital signals a closer read before pushing harder.",
  ];

  const second = [
    "Protect the strongest-performing digital lane while momentum is still clean.",
    "Use the healthier digital signal while reach is still translating into movement.",
    "Keep the stronger creative or platform signal working while it still has lift.",
  ];

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This signal has lingered across recent reads.",
      "It may be worth reading this as a recurring digital theme.",
      "This pressure keeps finding its way back into the brief.",
    ])}`,
    `${pickVariant(second, seed + 1)}${maybePatternTail(
      input.repeatedOpportunityCount,
      [
        "Digital keeps surfacing with some reliable upside.",
        "There may be more durable momentum here than expected.",
        "This opportunity lane has stayed alive across multiple reads.",
      ]
    )}`,
  ];
}

function printActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const first = [
    "Tighten approvals or delivery timing before print becomes the bottleneck.",
    "Keep the print lane moving before timing friction spreads downstream.",
    "Clear the next print constraint before it slows related work.",
  ];

  const second = [
    "Use the print assets that are already close to ready while the lane is still workable.",
    "Keep the cleaner print opportunities moving before timing gets tighter.",
    "Lean into the ready side of print while it still offers downstream help.",
  ];

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This dependency has shown up more than once now.",
      "Print timing may be becoming a recurring constraint.",
      "This looks a bit more structural than incidental.",
    ])}`,
    `${pickVariant(second, seed + 1)}${maybePatternTail(
      input.repeatedOpportunityCount,
      [
        "Print still seems to be offering some steady opportunity.",
        "There may be more usable readiness here than the first read suggests.",
        "This lane keeps surfacing with practical upside.",
      ]
    )}`,
  ];
}

function adminActionSet(input: ActionVariationInput) {
  const label = departmentLabel(input.department);
  const seed = buildSeed(input);

  const first = [
    `Keep ${label.toLowerCase()} aligned before pressure spreads wider across the campaign.`,
    `Take a closer look at ${label.toLowerCase()} while it is still shaping the broader read.`,
    `Re-center attention on ${label.toLowerCase()} before the surrounding lanes start reacting to it.`,
  ];

  const second = [
    `Use the cleaner opportunity around ${label.toLowerCase()} while the campaign still has room to act on it.`,
    `There may be a steadier opening in ${label.toLowerCase()} than the surface snapshot suggests.`,
    `Let ${label.toLowerCase()} do some stabilizing work while the signal is still favorable.`,
  ];

  const third = [
    "Keep an eye on the cross-lane effects, not just the lane itself.",
    "The broader read matters here as much as the local pressure point.",
    "This looks like something to track in context, not isolation.",
  ];

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPrimaryCount, [
      "Abe keeps returning to this lane for a reason.",
      "This lane has shaped the read across more than one cycle.",
      "It may be more central than it first appears.",
    ])}`,
    `${pickVariant(second, seed + 1)}${maybePatternTail(
      input.repeatedOpportunityCount,
      [
        "The opportunity signal here has been fairly consistent.",
        "This lane keeps offering usable leverage.",
        "There seems to be repeatable strength here.",
      ]
    )}`,
    pickVariant(third, seed + 2),
  ];
}

export function buildAbeActionSet(input: ActionVariationInput) {
  if (input.role === "admin") {
    return adminActionSet(input).slice(0, 3);
  }

  switch (input.department) {
    case "finance":
      return financeActionSet(input).slice(0, 2);
    case "field":
      return fieldActionSet(input).slice(0, 2);
    case "digital":
      return digitalActionSet(input).slice(0, 2);
    case "print":
      return printActionSet(input).slice(0, 2);
    case "outreach":
    default:
      return outreachActionSet(input).slice(0, 2);
  }
}