import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { getConnection } from "@/lib/integrations/connection-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "routes";
const MAX_INTERMEDIATE_WAYPOINTS = 25;

type DispatchJobRow = {
  id: string;
  name: string;
  address: string;
  contact_id?: string | null;
  assigned_user_id?: string | null;
  status: string;
};

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function parseGoogleDurationSeconds(value: unknown) {
  if (typeof value !== "string") return null;

  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)s$/);
  if (!match) return null;

  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? Math.round(seconds) : null;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_ROUTES_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_ROUTES_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    const requestedJobIds: string[] = Array.isArray(body?.jobIds)
      ? Array.from(
          new Set<string>(
            body.jobIds
              .map((value: unknown) => String(value || "").trim())
              .filter((value: string): value is string => value.length > 0),
          ),
        )
      : [];
    const startAddress = String(body?.startAddress || "").trim();
    const requestedRouteName = String(body?.routeName || "").trim();

    if (requestedJobIds.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one Dispatch job is required to generate a route.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const cookieStore = await cookies();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 },
      );
    }

    const organizationId =
      cookieStore.get("active_organization_id")?.value?.trim();

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "No active organization selected." },
        { status: 400 },
      );
    }

    const databaseClient = getAdminClient() ?? supabase;

    const { data: appUser, error: appUserError } = await databaseClient
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      console.error(
        "[BUSINESS ROUTES GENERATE] Aether user lookup failed",
        appUserError,
      );
      return NextResponse.json(
        { success: false, error: appUserError.message },
        { status: 500 },
      );
    }

    if (!appUser) {
      return NextResponse.json(
        { success: false, error: "Aether user profile not found." },
        { status: 403 },
      );
    }

    if (appUser.is_active === false) {
      return NextResponse.json(
        { success: false, error: "This user is inactive." },
        { status: 403 },
      );
    }

    const { data: membership, error: membershipError } = await databaseClient
      .from("organization_members")
      .select("id, organization_id")
      .eq("organization_id", organizationId)
      .eq("user_id", appUser.id)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "[BUSINESS ROUTES GENERATE] Membership lookup failed",
        membershipError,
      );
      return NextResponse.json(
        { success: false, error: membershipError.message },
        { status: 500 },
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No membership found for active organization. Active org cookie may be stale.",
        },
        { status: 403 },
      );
    }

    const connection = await getConnection(organizationId, PROVIDER);

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          error: "Google Routes is not connected for this organization.",
        },
        { status: 409 },
      );
    }

    const { data: jobRows, error: jobsError } = await databaseClient
      .from("business_dispatch_jobs")
      .select("id,name,address,contact_id,assigned_user_id,status")
      .eq("organization_id", organizationId)
      .in("id", requestedJobIds);

    if (jobsError) {
      console.error(
        "[BUSINESS ROUTES GENERATE] Dispatch jobs lookup failed",
        jobsError,
      );
      return NextResponse.json(
        { success: false, error: jobsError.message },
        { status: 500 },
      );
    }

    const jobs = (jobRows ?? []) as DispatchJobRow[];
    const jobsById = new Map(jobs.map((job) => [job.id, job]));

    // Restore caller order before Google optimizes it.
    const requestedJobs = requestedJobIds
      .map((id) => jobsById.get(id))
      .filter((job): job is DispatchJobRow => Boolean(job));

    const missingJobIds = requestedJobIds.filter((id) => !jobsById.has(id));

    if (missingJobIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more Dispatch jobs were not found in the active organization.",
          missingJobIds,
        },
        { status: 404 },
      );
    }

    const invalidJobs = requestedJobs
      .filter(
        (job) =>
          job.status === "completed" ||
          !job.address ||
          !job.address.trim(),
      )
      .map((job) => ({
        id: job.id,
        name: job.name,
        reason:
          job.status === "completed"
            ? "Job is already completed"
            : "Missing service address",
      }));

    if (invalidJobs.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Every routed Dispatch job must be active and have a service address.",
          invalidJobs,
        },
        { status: 400 },
      );
    }

    const maxJobs = startAddress
      ? MAX_INTERMEDIATE_WAYPOINTS + 1
      : MAX_INTERMEDIATE_WAYPOINTS + 2;

    if (requestedJobs.length > maxJobs) {
      return NextResponse.json(
        {
          success: false,
          error: `This route supports up to ${maxJobs} Dispatch jobs with the current Google Routes request shape.`,
        },
        { status: 400 },
      );
    }

    const routableJobs = requestedJobs.map((job) => ({
      job,
      formattedAddress: job.address.trim(),
    }));

    const originAddress =
      startAddress || routableJobs[0].formattedAddress;

    const destinationEntry =
      routableJobs[routableJobs.length - 1];

    const intermediateEntries = startAddress
      ? routableJobs.slice(0, -1)
      : routableJobs.slice(1, -1);

    const googleResponse = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex",
        },
        body: JSON.stringify({
          origin: { address: originAddress },
          destination: { address: destinationEntry.formattedAddress },
          intermediates: intermediateEntries.map(({ formattedAddress }) => ({
            address: formattedAddress,
          })),
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          optimizeWaypointOrder: intermediateEntries.length > 0,
          computeAlternativeRoutes: false,
          languageCode: "en-US",
          units: "IMPERIAL",
        }),
        cache: "no-store",
      },
    );

    const googlePayload = await googleResponse.json().catch(() => null);

    if (!googleResponse.ok) {
      const googleMessage =
        googlePayload?.error?.message ||
        googlePayload?.message ||
        `Google Routes API returned HTTP ${googleResponse.status}.`;

      console.error(
        "[BUSINESS ROUTES GENERATE] Google API failure",
        googlePayload,
      );

      return NextResponse.json(
        { success: false, error: googleMessage },
        {
          status:
            googleResponse.status >= 400 && googleResponse.status < 500
              ? 400
              : 502,
        },
      );
    }

    const googleRoute = googlePayload?.routes?.[0];

    if (!googleRoute) {
      return NextResponse.json(
        { success: false, error: "Google Routes did not return a route." },
        { status: 502 },
      );
    }

    const optimizedIndexes: number[] =
      googleRoute.optimizedIntermediateWaypointIndex ?? [];

    const optimizedIntermediates =
      optimizedIndexes.length === intermediateEntries.length
        ? optimizedIndexes.map((index) => intermediateEntries[index])
        : intermediateEntries;

    const orderedEntries =
      routableJobs.length === 1
        ? [
            {
              ...routableJobs[0],
              stopType: "destination" as const,
            },
          ]
        : [
            ...(startAddress
              ? []
              : [
                  {
                    ...routableJobs[0],
                    stopType: "origin" as const,
                  },
                ]),
            ...optimizedIntermediates.map((entry) => ({
              ...entry,
              stopType: "stop" as const,
            })),
            {
              ...destinationEntry,
              stopType: "destination" as const,
            },
          ];

    const orderedStops = orderedEntries.map(
      ({ job, formattedAddress, stopType }, index) => ({
        order: index + 1,
        jobId: job.id,
        contactId: job.contact_id ?? null,
        name: job.name,
        address: formattedAddress,
        stopType,
      }),
    );

    const routeName =
      requestedRouteName ||
      `Dispatch Route ${new Date().toLocaleDateString("en-US")}`;

    const durationSeconds = parseGoogleDurationSeconds(googleRoute.duration);

    const { data: savedRoute, error: routeInsertError } = await databaseClient
      .from("business_dispatch_routes")
      .insert({
        organization_id: organizationId,
        name: routeName,
        origin_address: originAddress,
        total_distance_meters: googleRoute.distanceMeters ?? null,
        total_duration_seconds: durationSeconds,
        encoded_polyline: googleRoute.polyline?.encodedPolyline ?? null,
        updated_at: new Date().toISOString(),
      })
      .select("id,name")
      .single();

    if (routeInsertError || !savedRoute) {
      console.error(
        "[BUSINESS ROUTES GENERATE] Route persistence failed",
        routeInsertError,
      );
      return NextResponse.json(
        {
          success: false,
          error:
            routeInsertError?.message ||
            "Google generated the route, but Aether could not save it.",
        },
        { status: 500 },
      );
    }

    const routeJobRows = orderedStops.map((stop) => ({
      route_id: savedRoute.id,
      dispatch_job_id: stop.jobId,
      stop_order: stop.order,
    }));

    const { error: routeJobsInsertError } = await databaseClient
      .from("business_dispatch_route_jobs")
      .insert(routeJobRows);

    if (routeJobsInsertError) {
      console.error(
        "[BUSINESS ROUTES GENERATE] Route stop persistence failed",
        routeJobsInsertError,
      );

      // Avoid leaving behind a route with no trustworthy stop sequence.
      await databaseClient
        .from("business_dispatch_routes")
        .delete()
        .eq("id", savedRoute.id)
        .eq("organization_id", organizationId);

      return NextResponse.json(
        {
          success: false,
          error: `Google generated the route, but Aether could not save its stop order: ${routeJobsInsertError.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      provider: PROVIDER,
      managedBy: "aether",
      organizationId,
      route: {
        id: savedRoute.id,
        name: savedRoute.name,
        distanceMeters: googleRoute.distanceMeters ?? null,
        duration: googleRoute.duration ?? null,
        durationSeconds,
        encodedPolyline: googleRoute.polyline?.encodedPolyline ?? null,
        originAddress,
        destinationAddress: destinationEntry.formattedAddress,
        orderedStops,
      },
      counts: {
        requestedJobs: requestedJobs.length,
        routedJobs: orderedStops.length,
      },
    });
  } catch (error: any) {
    console.error("[BUSINESS ROUTES GENERATE] Failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate Google route.",
      },
      { status: 500 },
    );
  }
}
