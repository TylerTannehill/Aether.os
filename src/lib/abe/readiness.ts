export function abeReady(
  ...conditions: Array<boolean | null | undefined>
): boolean {
  return conditions.every((condition) => condition === true);
}

export function financeAbeReady(input: {
  loading: boolean;
  orgContext: unknown;
}) {
  return abeReady(
    !input.loading,
    input.orgContext !== undefined,
    input.orgContext !== null,
  );
}

export function fieldAbeReady(input: {
  loading: boolean;
  orgContext: unknown;
}) {
  return abeReady(
    !input.loading,
    input.orgContext !== undefined,
    input.orgContext !== null,
  );
}

export function digitalAbeReady(input: {
  loading: boolean;
  orgContext: unknown;
}) {
  return abeReady(
    !input.loading,
    input.orgContext !== undefined,
    input.orgContext !== null,
  );
}

export function outreachAbeReady(input: {
  loading: boolean;
  orgContext: unknown;
}) {
  return abeReady(
    !input.loading,
    input.orgContext !== undefined,
    input.orgContext !== null,
  );
}

export function printAbeReady(input: {
  loading: boolean;
  orgContext: unknown;
}) {
  return abeReady(
    !input.loading,
    input.orgContext !== undefined,
    input.orgContext !== null,
  );
}

export function dashboardAbeReady(input: {
  loading: boolean;
  orgContext: unknown;
  strategyReady: boolean;
  metricsReady: boolean;
}) {
  return abeReady(
    !input.loading,
    input.orgContext !== undefined,
    input.orgContext !== null,
    input.strategyReady,
    input.metricsReady,
  );
}