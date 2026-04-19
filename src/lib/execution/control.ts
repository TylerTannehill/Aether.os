export type ExecutionMode = "manual" | "auto" | "hybrid";

export interface ExecutionSettings {
  mode: ExecutionMode;
  confidenceThreshold: number; // 0–1
  requireApproval: boolean;
}

let settings: ExecutionSettings = {
  mode: "hybrid",
  confidenceThreshold: 0.75,
  requireApproval: true,
};

export function getExecutionSettings(): ExecutionSettings {
  return settings;
}

export function updateExecutionSettings(
  newSettings: Partial<ExecutionSettings>
) {
  settings = { ...settings, ...newSettings };
}

export function shouldAutoExecute(confidence: number): boolean {
  if (settings.mode === "manual") return false;

  if (settings.mode === "auto") {
    return confidence >= settings.confidenceThreshold;
  }

  // hybrid mode
  return (
    confidence >= settings.confidenceThreshold &&
    !settings.requireApproval
  );
}