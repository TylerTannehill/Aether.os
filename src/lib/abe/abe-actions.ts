// src/lib/abe/abe-actions.ts

import { AbeDepartment, departmentLabel } from "./abe-memory";

type AbeRole = "admin" | "director" | "general_user";
type DominantBehavior = "ignored" | "attempted" | "completed";
type OutcomeTrend = "improving" | "flat" | "declining";

type ActionVariationInput = {
  role: AbeRole;
  department: AbeDepartment;
  repeatedPressureCount?: number;
  repeatedOpportunityCount?: number;
  repeatedPrimaryCount?: number;
  dominantBehavior?: DominantBehavior;
  outcomeTrend?: OutcomeTrend;
};

function pickVariant(options: string[], seed: number) {
  if (options.length === 0) return "";
  return options[Math.abs(seed) % options.length];
}

function buildSeed(input: ActionVariationInput) {
  return (
    (input.repeatedPressureCount ?? 0) * 3 +
    (input.repeatedOpportunityCount ?? 0) * 5 +
    (input.repeatedPrimaryCount ?? 0) * 7 +
    (input.dominantBehavior === "ignored" ? 11 : 0) +
    (input.dominantBehavior === "attempted" ? 13 : 0) +
    (input.dominantBehavior === "completed" ? 17 : 0) +
    (input.outcomeTrend === "declining" ? 19 : 0) +
    (input.outcomeTrend === "improving" ? 23 : 0)
  );
}

function maybePatternTail(
  repeatedCount: number | undefined,
  variants: string[]
) {
  if (!repeatedCount || repeatedCount < 2) return "";

  // Tail governor: once a pattern becomes highly repeated, let escalation
  // language carry the weight instead of stacking multiple clauses.
  if (repeatedCount >= 4) return "";

  return ` ${pickVariant(variants, repeatedCount)}`;
}

function escalationLevel(count?: number) {
  if (!count) return 0;
  if (count >= 4) return 2;
  if (count >= 2) return 1;
  return 0;
}

function escalationTail(
  input: ActionVariationInput,
  variants: {
    ignored?: string[];
    attempted?: string[];
    completed?: string[];
  }
) {
  const level = escalationLevel(input.repeatedPressureCount);

  if (level === 0) return "";

  if (input.dominantBehavior === "ignored" && variants.ignored?.length) {
    return ` ${pickVariant(variants.ignored, buildSeed(input) + 31)}`;
  }

  if (input.dominantBehavior === "attempted" && variants.attempted?.length) {
    return ` ${pickVariant(variants.attempted, buildSeed(input) + 37)}`;
  }

  if (input.dominantBehavior === "completed" && variants.completed?.length) {
    return ` ${pickVariant(variants.completed, buildSeed(input) + 41)}`;
  }

  return "";
}

function behaviorTail(
  input: ActionVariationInput,
  variants: {
    ignored?: string[];
    attempted?: string[];
    completed?: string[];
  }
) {
  // Tail governor: when opportunity is already repeating, let the
  // opportunity-pattern line speak instead of adding another behavior clause.
  if ((input.repeatedOpportunityCount ?? 0) >= 2) return "";

  if (input.dominantBehavior === "ignored" && variants.ignored?.length) {
    return ` ${pickVariant(variants.ignored, buildSeed(input) + 1)}`;
  }

  if (input.dominantBehavior === "attempted" && variants.attempted?.length) {
    return ` ${pickVariant(variants.attempted, buildSeed(input) + 2)}`;
  }

  if (input.dominantBehavior === "completed" && variants.completed?.length) {
    return ` ${pickVariant(variants.completed, buildSeed(input) + 3)}`;
  }

  return "";
}

function outcomeTail(
  input: ActionVariationInput,
  variants: {
    improving?: string[];
    declining?: string[];
  }
) {
  // Tail governor: if repeated pressure is already being named, avoid stacking
  // outcome commentary onto the same action sentence.
  if (escalationLevel(input.repeatedPressureCount) > 0) return "";

  if (input.outcomeTrend === "improving" && variants.improving?.length) {
    return ` ${pickVariant(variants.improving, buildSeed(input) + 4)}`;
  }

  if (input.outcomeTrend === "declining" && variants.declining?.length) {
    return ` ${pickVariant(variants.declining, buildSeed(input) + 5)}`;
  }

  return "";
}

function outreachActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const firstIgnored = [
    "Pick up the next layer of follow-up while engagement is still warm.",
    "Re-engage the follow-up queue before interest cools further.",
    "Clear the most obvious outreach backlog before contact energy drifts.",
  ];

  const firstAttempted = [
    "Tighten how the follow-up queue is being worked so effort turns into cleaner movement.",
    "Refocus outreach on the warmest contacts before more effort gets absorbed without resolution.",
    "Adjust the next round of outreach follow-through so activity creates more lift.",
  ];

  const firstCompleted = [
    "Build on the outreach follow-through that is already landing while engagement is still warm.",
    "Use the current outreach traction to move into the next strongest contacts.",
    "Keep the outreach lane moving now that some of the queue is starting to clear.",
  ];

  const second = [
    "Keep the outreach lane moving while responsiveness is still on your side.",
    "Use the current engagement window before it starts to narrow.",
    "Lean into the strongest conversations while they still have momentum.",
  ];

  const first =
    input.dominantBehavior === "ignored"
      ? firstIgnored
      : input.dominantBehavior === "attempted"
      ? firstAttempted
      : firstCompleted;

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This pressure has surfaced more than once now.",
      "This looks a bit more persistent than a one-cycle bump.",
      "It may be worth treating this like a recurring theme.",
    ])}${outcomeTail(input, {
      improving: [
        "There are early signs that outreach is starting to steady.",
        "That movement may be worth reinforcing while it is taking hold.",
      ],
      declining: [
        "The lane still does not look like it is resolving cleanly yet.",
        "Recent effort may need a slightly different shape to create relief.",
      ],
    })}${escalationTail(input, {
      ignored: [
        "This has been sitting long enough that it likely needs direct pickup now.",
        "At this point, the backlog itself is becoming part of the problem.",
      ],
      attempted: [
        "The same outreach friction keeps showing up, so a different handling approach may be overdue.",
        "Repeated effort without relief may mean the lane needs a cleaner playbook, not just more touches.",
      ],
      completed: [
        "This consistency is starting to look durable enough to build around.",
        "The lane is showing enough steadiness that Abe can lean a little further into it.",
      ],
    })}`,
    `${pickVariant(second, seed + 1)}${behaviorTail(input, {
      ignored: [
        "Right now the bigger risk is drift, not lack of opportunity.",
        "This lane may need pickup more than expansion.",
      ],
      attempted: [
        "There is effort here already, so the question is shape more than volume.",
        "This may respond better to adjustment than additional raw activity.",
      ],
      completed: [
        "There is enough movement here to carry a bit more weight.",
        "This lane looks ready for the next useful push.",
      ],
    })}${maybePatternTail(input.repeatedOpportunityCount, [
      "There may be steadier upside here than the brief first suggests.",
      "The opportunity signal here has stayed healthier than usual.",
      "This lane keeps offering usable movement.",
    ])}`,
  ];
}

function financeActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const firstIgnored = [
    "Pick up donor follow-through where pledged dollars are still waiting.",
    "Re-open the most exposed pledge collection work before it drifts further.",
    "Clear the next layer of finance follow-up before revenue sits idle longer.",
  ];

  const firstAttempted = [
    "Tighten donor follow-through so current effort translates into cleaner collection.",
    "Adjust the collection approach where activity is happening without enough resolution.",
    "Refine the next finance touch so effort turns into cleaner movement.",
  ];

  const firstCompleted = [
    "Build on the finance movement that is already starting to land.",
    "Use the current collection traction to press into the next cleanest opportunities.",
    "Keep finance moving while this lane is starting to stabilize.",
  ];

  const second = [
    "Keep revenue movement steady while the finance lane still has room to stabilize.",
    "Use the current finance momentum before pressure starts to stack.",
    "Give the cleanest collection opportunities attention before they stale out.",
  ];

  const first =
    input.dominantBehavior === "ignored"
      ? firstIgnored
      : input.dominantBehavior === "attempted"
      ? firstAttempted
      : firstCompleted;

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This pressure point has shown up repeatedly.",
      "It may be worth treating this as a pattern, not a one-off.",
      "This part of the lane keeps resurfacing in the read.",
    ])}${outcomeTail(input, {
      improving: [
        "Finance may be starting to firm up around that work.",
        "That stabilization could be worth reinforcing while it is visible.",
      ],
      declining: [
        "The lane still looks softer than the activity level suggests.",
        "This may need a cleaner conversion path, not just more touches.",
      ],
    })}${escalationTail(input, {
      ignored: [
        "This queue has lingered long enough that finance follow-through likely needs direct attention now.",
        "The delay itself is becoming a pressure source, not just a symptom.",
      ],
      attempted: [
        "Repeated effort here may mean the collection path needs to change, not just continue.",
        "Finance is absorbing work without enough relief, which suggests a strategy adjustment may be due.",
      ],
      completed: [
        "This lane is steady enough that Abe can start treating it like usable support.",
        "There is enough consistency here to let finance carry a bit more stabilizing weight.",
      ],
    })}`,
    `${pickVariant(second, seed + 1)}${behaviorTail(input, {
      ignored: [
        "Right now the larger risk is drift inside the collection queue.",
        "This may need pickup before it needs scale.",
      ],
      attempted: [
        "There is already effort here, so adjustment may matter more than volume.",
        "The issue may be conversion quality more than lack of activity.",
      ],
      completed: [
        "There is enough traction here to support the next move.",
        "This lane may be ready to do a bit more stabilizing work.",
      ],
    })}${maybePatternTail(input.repeatedOpportunityCount, [
      "Finance keeps showing signs of usable stability.",
      "There is still workable momentum here.",
      "This lane keeps offering room to strengthen the overall picture.",
    ])}`,
  ];
}

function fieldActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const firstIgnored = [
    "Support field pickup before uneven coverage turns into drag.",
    "Re-engage the weaker turf areas before pace slips further.",
    "Get the most exposed field work moving again before completion softens more.",
  ];

  const firstAttempted = [
    "Adjust the field push so current effort turns into cleaner completion.",
    "Refine turf movement where activity exists but completion is still lagging.",
    "Support the parts of field that are moving without resolving pressure yet.",
  ];

  const firstCompleted = [
    "Build on the field work that is already converting into completion.",
    "Use the current field momentum to press through the next soft patch.",
    "Keep the field lane moving while completion is starting to stabilize.",
  ];

  const second = [
    "Lean into the stronger field pockets while activity is still productive.",
    "Use the current field movement before it starts to flatten.",
    "Keep the best field momentum moving while the lane still feels live.",
  ];

  const first =
    input.dominantBehavior === "ignored"
      ? firstIgnored
      : input.dominantBehavior === "attempted"
      ? firstAttempted
      : firstCompleted;

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This softness has stayed visible across more than one read.",
      "The weaker field signal may be lingering a bit.",
      "This looks less temporary than it did at first.",
    ])}${outcomeTail(input, {
      improving: [
        "Field may be starting to settle into a healthier rhythm.",
        "That movement may be worth reinforcing while it is visible.",
      ],
      declining: [
        "The lane still looks softer than the effort level would suggest.",
        "This may respond better to rerouting than simply pushing harder.",
      ],
    })}${escalationTail(input, {
      ignored: [
        "The same field softness has lingered long enough that it likely needs direct pickup now.",
        "At this point, the gap in coverage is becoming a pattern Abe can no longer treat as temporary.",
      ],
      attempted: [
        "Repeated effort without cleaner completion suggests the field approach itself may need adjustment.",
        "This lane may need support and rerouting now, not just more push.",
      ],
      completed: [
        "Field is steady enough that Abe can treat it as a lane worth leaning into.",
        "This consistency suggests the next completion push can be a little more ambitious.",
      ],
    })}`,
    `${pickVariant(second, seed + 1)}${behaviorTail(input, {
      ignored: [
        "This looks more like a pickup problem than a capacity problem.",
        "Right now the field lane may need reactivation more than expansion.",
      ],
      attempted: [
        "There is movement here already, so the next gain may come from shaping it better.",
        "This may benefit more from support and routing than raw pace.",
      ],
      completed: [
        "There is enough traction here to carry a little more weight.",
        "This lane looks ready for the next useful completion push.",
      ],
    })}${maybePatternTail(input.repeatedOpportunityCount, [
      "Field keeps showing some repeatable upside.",
      "There is still useful movement here to build around.",
      "This lane may be more durable than a single-cycle spike.",
    ])}`,
  ];
}

function digitalActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const firstIgnored = [
    "Watch the weaker digital pressure points before they keep drifting in the background.",
    "Re-engage the softer digital work before it becomes a recurring drag.",
    "Clear the most exposed digital pressure point before it compounds quietly.",
  ];

  const firstAttempted = [
    "Adjust the current digital effort before more activity gets absorbed without resolution.",
    "Refine the weaker digital lane so effort translates into cleaner movement.",
    "Rework the current digital push where activity exists but pressure is still hanging around.",
  ];

  const firstCompleted = [
    "Build on the digital work that is already starting to stabilize the lane.",
    "Use the current digital traction to press into the next strongest opening.",
    "Keep the stronger digital movement alive while the lane is starting to steady.",
  ];

  const second = [
    "Protect the strongest-performing digital lane while momentum is still clean.",
    "Use the healthier digital signal while reach is still translating into movement.",
    "Keep the stronger creative or platform signal working while it still has lift.",
  ];

  const first =
    input.dominantBehavior === "ignored"
      ? firstIgnored
      : input.dominantBehavior === "attempted"
      ? firstAttempted
      : firstCompleted;

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This signal has lingered across recent reads.",
      "It may be worth reading this as a recurring digital theme.",
      "This pressure keeps finding its way back into the brief.",
    ])}${outcomeTail(input, {
      improving: [
        "Digital may be starting to settle into cleaner movement.",
        "That stabilization may be worth protecting while it is visible.",
      ],
      declining: [
        "The lane still does not look like it is converting cleanly enough.",
        "This may need refinement more than additional push.",
      ],
    })}${escalationTail(input, {
      ignored: [
        "This digital drift has hung around long enough that it likely needs direct intervention now.",
        "The longer this sits, the more likely it becomes a repeating digital drag.",
      ],
      attempted: [
        "Repeated effort without cleaner conversion suggests the digital approach itself may need to change.",
        "Abe keeps seeing work here without enough relief, which points more toward refinement than persistence.",
      ],
      completed: [
        "This lane is showing enough stability that Abe can start treating it like reliable lift.",
        "Digital is steady enough here to support a slightly bigger next move.",
      ],
    })}`,
    `${pickVariant(second, seed + 1)}${behaviorTail(input, {
      ignored: [
        "Right now the bigger issue may be pickup, not lack of signal.",
        "This lane may need re-engagement before it needs more volume.",
      ],
      attempted: [
        "There is already effort here, so the next gain may come from reshaping it.",
        "This feels more like a quality problem than an activity problem.",
      ],
      completed: [
        "There is enough stability here to support the next move.",
        "This lane looks ready to carry a little more weight.",
      ],
    })}${maybePatternTail(input.repeatedOpportunityCount, [
      "Digital keeps surfacing with some reliable upside.",
      "There may be more durable momentum here than expected.",
      "This opportunity lane has stayed alive across multiple reads.",
    ])}`,
  ];
}

function printActionSet(input: ActionVariationInput) {
  const seed = buildSeed(input);

  const firstIgnored = [
    "Tighten the next print bottleneck before timing drift spreads downstream.",
    "Re-engage the softest print constraint before it keeps holding related work back.",
    "Clear the most exposed print delay before it settles into a recurring block.",
  ];

  const firstAttempted = [
    "Adjust the current print push so effort translates into cleaner timing resolution.",
    "Refine the part of print that is moving without fully clearing the bottleneck.",
    "Tighten print handling where activity exists but the constraint is still hanging around.",
  ];

  const firstCompleted = [
    "Build on the print work that is already starting to clear timing pressure.",
    "Use the current print stabilization to move the next downstream dependency.",
    "Keep the print lane moving while it is beginning to steady.",
  ];

  const second = [
    "Use the print assets that are already close to ready while the lane is still workable.",
    "Keep the cleaner print opportunities moving before timing gets tighter.",
    "Lean into the ready side of print while it still offers downstream help.",
  ];

  const first =
    input.dominantBehavior === "ignored"
      ? firstIgnored
      : input.dominantBehavior === "attempted"
      ? firstAttempted
      : firstCompleted;

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPressureCount, [
      "This dependency has shown up more than once now.",
      "Print timing may be becoming a recurring constraint.",
      "This looks a bit more structural than incidental.",
    ])}${outcomeTail(input, {
      improving: [
        "Print may be starting to settle into a healthier timing rhythm.",
        "That steadier movement may be worth reinforcing while it holds.",
      ],
      declining: [
        "The lane still looks softer than the effort level suggests.",
        "This may need a cleaner path through the bottleneck, not just more activity.",
      ],
    })}${escalationTail(input, {
      ignored: [
        "This print bottleneck has lingered long enough that it likely needs direct pickup now.",
        "The delay itself is becoming part of the workflow pressure, not just a symptom.",
      ],
      attempted: [
        "Repeated activity without cleaner timing suggests the print path itself may need adjustment.",
        "Abe keeps seeing work here without enough relief, which points to a routing fix more than more push.",
      ],
      completed: [
        "Print is steady enough here to support the next downstream dependency.",
        "This lane is showing enough consistency that Abe can lean on it a bit more.",
      ],
    })}`,
    `${pickVariant(second, seed + 1)}${behaviorTail(input, {
      ignored: [
        "This lane may need pickup before it needs added output.",
        "Right now the larger issue may be movement, not volume.",
      ],
      attempted: [
        "There is already effort here, so refinement may matter more than more push.",
        "This looks more like a routing problem than a work-rate problem.",
      ],
      completed: [
        "There is enough traction here to support the next downstream move.",
        "This lane looks ready to keep relieving pressure if it stays moving.",
      ],
    })}${maybePatternTail(input.repeatedOpportunityCount, [
      "Print still seems to be offering some steady opportunity.",
      "There may be more usable readiness here than the first read suggests.",
      "This lane keeps surfacing with practical upside.",
    ])}`,
  ];
}

function adminActionSet(input: ActionVariationInput) {
  const label = departmentLabel(input.department);
  const seed = buildSeed(input);

  const firstIgnored = [
    `Re-center attention on ${label.toLowerCase()} before inactivity in that lane spreads more pressure across the campaign.`,
    `Take a closer look at ${label.toLowerCase()} because the work there does not seem to be getting picked up cleanly enough.`,
    `Bring ${label.toLowerCase()} back into focus before drift in that lane starts shaping the broader read.`,
  ];

  const firstAttempted = [
    `Stay close to ${label.toLowerCase()} because effort is happening there without enough resolution yet.`,
    `Look more closely at how ${label.toLowerCase()} is being worked before more activity gets absorbed without relief.`,
    `Refine the campaign’s approach to ${label.toLowerCase()} while that lane is active but still unresolved.`,
  ];

  const firstCompleted = [
    `Use the stability starting to show in ${label.toLowerCase()} while the campaign still has room to build on it.`,
    `Let ${label.toLowerCase()} carry a bit more weight now that work in that lane is starting to land.`,
    `Build from the steadier movement in ${label.toLowerCase()} before the read shifts again.`,
  ];

  const second = [
    `Use the cleaner opportunity around ${label.toLowerCase()} while the campaign still has room to act on it.`,
    `There may be a steadier opening in ${label.toLowerCase()} than the surface snapshot suggests.`,
    `Let ${label.toLowerCase()} do some stabilizing work while the signal is still favorable.`,
  ];

  const thirdIgnored = [
    "The broader read suggests pickup matters more than expansion right now.",
    "The campaign may need re-engagement in that lane before trying to scale it.",
    "This looks more like a drift problem than a scarcity problem.",
  ];

  const thirdAttempted = [
    "The broader read suggests adjustment matters more than more raw effort right now.",
    "This looks like a lane that may benefit from refinement rather than added push.",
    "The campaign may need a different shape of work there, not just more of it.",
  ];

  const thirdCompleted = [
    "The broader read suggests that lane may be ready to support the next move.",
    "This looks like a lane the campaign can lean on a bit more right now.",
    "There may be enough steadiness there to carry more strategic weight.",
  ];

  const first =
    input.dominantBehavior === "ignored"
      ? firstIgnored
      : input.dominantBehavior === "attempted"
      ? firstAttempted
      : firstCompleted;

  const third =
    input.dominantBehavior === "ignored"
      ? thirdIgnored
      : input.dominantBehavior === "attempted"
      ? thirdAttempted
      : thirdCompleted;

  return [
    `${pickVariant(first, seed)}${maybePatternTail(input.repeatedPrimaryCount, [
      "Abe keeps returning to this lane for a reason.",
      "This lane has shaped the read across more than one cycle.",
      "It may be more central than it first appears.",
    ])}${outcomeTail(input, {
      improving: [
        "There are early signs this lane is stabilizing enough to matter more broadly.",
        "That steadier movement may be worth reinforcing at the campaign level.",
      ],
      declining: [
        "The campaign still does not seem to be getting enough resolution from that lane.",
        "This may need a strategic adjustment, not just continued motion.",
      ],
    })}${escalationTail(input, {
      ignored: [
        "That lane has lingered long enough that it likely needs direct campaign-level attention now.",
        "Abe is treating this less like a passing dip and more like a real operating pattern now.",
      ],
      attempted: [
        "The campaign has put effort into this lane repeatedly without enough relief, which points toward a strategic change.",
        "Abe is reading this less as a work-rate issue and more as an approach issue now.",
      ],
      completed: [
        "This lane is consistent enough that it may be able to carry more strategic weight.",
        "Abe is starting to treat this as reliable support, not just a temporary bright spot.",
      ],
    })}`,
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
