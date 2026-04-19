// src/lib/abe/abe-filters.ts

import { AbePatternInsight, AbeDepartment } from "./abe-memory";

export function filterPatternsForDepartment(
  patterns: AbePatternInsight[],
  department: AbeDepartment
) {
  return patterns
    .filter((p) => {
      if (p.lane) return p.lane === department;

      return p.detail.toLowerCase().includes(department);
    })
    .slice(0, 2);
}