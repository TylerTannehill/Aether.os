export type AutonomyMode = "off" | "suggest" | "auto_safe";

export type BrainStrategyMode =
  | "balanced"
  | "cleanup"
  | "fundraising_push"
  | "outreach_push"
  | "stability";

export type AutonomyConfig = {
  mode: AutonomyMode;
  strategy: BrainStrategyMode;
  allowPolicyApply: boolean;
  allowStrategyAutoShift: boolean;
  maxAutoAppliesPerDay: number;
  maxStrategyShiftsPerDay: number;
};

export const DEFAULT_AUTONOMY_CONFIG: AutonomyConfig = {
  mode: "suggest",
  strategy: "balanced",
  allowPolicyApply: false,
  allowStrategyAutoShift: true,
  maxAutoAppliesPerDay: 2,
  maxStrategyShiftsPerDay: 3,
};

export function isAutonomyOff(config?: Partial<AutonomyConfig> | null): boolean {
  return (config?.mode ?? DEFAULT_AUTONOMY_CONFIG.mode) === "off";
}

export function isSuggestionMode(
  config?: Partial<AutonomyConfig> | null
): boolean {
  return (config?.mode ?? DEFAULT_AUTONOMY_CONFIG.mode) === "suggest";
}

export function isAutoSafeMode(
  config?: Partial<AutonomyConfig> | null
): boolean {
  return (config?.mode ?? DEFAULT_AUTONOMY_CONFIG.mode) === "auto_safe";
}

export function mergeAutonomyConfig(
  overrides?: Partial<AutonomyConfig> | null
): AutonomyConfig {
  return {
    ...DEFAULT_AUTONOMY_CONFIG,
    ...(overrides ?? {}),
  };
}