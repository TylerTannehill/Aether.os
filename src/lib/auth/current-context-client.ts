
type CurrentContextResult = {
  response: Response;
  data: any;
};

let pendingContextRequest: Promise<CurrentContextResult> | null = null;

/**
 * Shares overlapping current-context requests.
 *
 * This is NOT a persistent cache:
 * - Concurrent callers reuse the same request.
 * - Once it completes, the pending reference is cleared.
 * - Future calls fetch fresh organization and role context.
 */
export function getSharedCurrentContext(): Promise<CurrentContextResult> {
  if (pendingContextRequest) {
    return pendingContextRequest;
  }

  const request = (async (): Promise<CurrentContextResult> => {
    const response = await fetch("/api/auth/current-context", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    return { response, data };
  })();

  pendingContextRequest = request;

  void request.finally(() => {
    if (pendingContextRequest === request) {
      pendingContextRequest = null;
    }
  }).catch(() => {
    // The caller receives the original rejection.
  });

  return request;
}
