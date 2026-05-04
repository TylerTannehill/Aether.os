export * from "./context-layer";

// Core decision engine
export {
  decideBrainItem,
  decideBrainItems,
  type BrainDecisionBreakdown,
  type BrainDecisionResult,
  type BrainDecisionTier,
  type BrainDecisionWeights,
} from "./decision-engine";

// Brain orchestration
export {
  buildBrainOrchestratorResult,
  type AbeAlignmentContext,
  type BrainOrchestratorContactInput,
  type BrainOrchestratorInput,
  type BrainOrchestratorOpportunityInput,
  type BrainOrchestratorResult,
  type BrainOrchestratorTaskInput,
  type BrainRankedOpportunity,
  type BrainRankedTask,
  type BrainTopLineSummary,
} from "./brain-orchestrator";

// Dashboard adapter
export {
  buildDashboardBrainOutput,
  type DashboardBrainContact,
  type DashboardBrainInput,
  type DashboardBrainOutput,
  type DashboardBrainPriorityTask,
  type DashboardBrainTask,
} from "./dashboard-brain-adapter";

// Auto systems
export * from "./auto-mode";
export * from "./auto-runner";
export * from "./auto-mode-policy";

// Policy and governance
export * from "./policy-guard";
export * from "./policy-feedback";
export * from "./autonomy-config";
export * from "./policy-recommendations";
export * from "./policy-versioning";

// Strategy and feedback
export * from "./strategy-layer";
export * from "./feedback-loop";
