import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import { getConnection } from "@/lib/integrations/connection-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "routes";
const MAX_INTERMEDIATE_WAYPOINTS = 25;

type RouteContact = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  organization_id?: string | null;
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

function formatAddress(contact: RouteContact) {
  return [
    contact.address?.trim(),
    contact.city?.trim(),
    contact.state?.trim(),
    contact.zip?.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

function contactName(contact: RouteContact) {
  return [contact.first_name?.trim(), contact.last_name?.trim()]
    .filter(Boolean)
    .join(" ") || "Unnamed contact";
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
    const listId = String(body?.listId || "").trim();
    const startAddress = String(body?.startAddress || "").trim();

    if (!listId) {
      return NextResponse.json(
        { success: false, error: "A field list is required." },
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
        { success: false, error: "No active campaign selected." },
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
      console.error("Google Routes generate Aether user lookup failed", appUserError);
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
      .select("id, organization_id, profile_status")
      .eq("organization_id", organizationId)
      .eq("user_id", appUser.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Google Routes generate membership lookup failed", membershipError);
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

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        { success: false, error: "Your campaign access is not active." },
        { status: 403 },
      );
    }

    const connection = await getConnection(organizationId, PROVIDER);

    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          error: "Google Routes is not connected for this campaign.",
        },
        { status: 409 },
      );
    }

    const { data: list, error: listError } = await databaseClient
      .from("lists")
      .select("id, name, type, organization_id")
      .eq("id", listId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (listError) {
      console.error("Google Routes generate list lookup failed", listError);
      return NextResponse.json(
        { success: false, error: listError.message },
        { status: 500 },
      );
    }

    if (!list) {
      return NextResponse.json(
        { success: false, error: "Field list not found in active campaign." },
        { status: 404 },
      );
    }

    if (String(list.type || "").toLowerCase() !== "field") {
      return NextResponse.json(
        { success: false, error: "Routes can only be generated for Field lists." },
        { status: 400 },
      );
    }

    const { data: memberships, error: contactsError } = await databaseClient
      .from("list_contacts")
      .select(
        "contact_id, contacts(id, first_name, last_name, address, city, state, zip, organization_id)",
      )
      .eq("list_id", listId);

    if (contactsError) {
      console.error("Google Routes generate contacts lookup failed", contactsError);
      return NextResponse.json(
        { success: false, error: contactsError.message },
        { status: 500 },
      );
    }

    const contacts = ((memberships ?? []) as any[])
      .flatMap((row) => {
        const linked = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
        return linked ? [linked as RouteContact] : [];
      })
      .filter((contact) => contact.organization_id === organizationId);

    const validContacts = contacts
      .map((contact) => ({
        contact,
        formattedAddress: formatAddress(contact),
      }))
      .filter(({ contact, formattedAddress }) => {
        return Boolean(contact.address?.trim() && formattedAddress);
      });

    const skippedContacts = contacts
      .filter((contact) => !contact.address?.trim())
      .map((contact) => ({
        id: contact.id,
        name: contactName(contact),
        reason: "Missing street address",
      }));

    if (validContacts.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "At least two contacts with street addresses are required to generate a route.",
          skippedContacts,
        },
        { status: 400 },
      );
    }

    /*
      Google Routes supports up to 25 intermediate waypoints for this request shape.
      We reserve the first and last valid contacts as route endpoints unless the
      caller supplies a startAddress. Additional contacts beyond the supported
      request size are returned as skipped rather than silently discarded.
    */
    const maxContacts = startAddress
      ? MAX_INTERMEDIATE_WAYPOINTS + 1
      : MAX_INTERMEDIATE_WAYPOINTS + 2;

    const routableContacts = validContacts.slice(0, maxContacts);
    const overflowContacts = validContacts.slice(maxContacts).map(({ contact }) => ({
      id: contact.id,
      name: contactName(contact),
      reason: "Route exceeds the current waypoint limit",
    }));

    const originAddress =
      startAddress || routableContacts[0].formattedAddress;

    const destinationEntry =
      routableContacts[routableContacts.length - 1];

    const intermediateEntries = startAddress
      ? routableContacts.slice(0, -1)
      : routableContacts.slice(1, -1);

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

      console.error("Google Routes generate API failure", googlePayload);

      return NextResponse.json(
        { success: false, error: googleMessage },
        { status: googleResponse.status >= 400 && googleResponse.status < 500 ? 400 : 502 },
      );
    }

    const route = googlePayload?.routes?.[0];

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Google Routes did not return a route." },
        { status: 502 },
      );
    }

    const optimizedIndexes: number[] =
      route.optimizedIntermediateWaypointIndex ?? [];

    const optimizedIntermediates =
      optimizedIndexes.length === intermediateEntries.length
        ? optimizedIndexes.map((index) => intermediateEntries[index])
        : intermediateEntries;

    const orderedStops = [
      ...(startAddress
        ? []
        : [
            {
              ...routableContacts[0],
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
    ].map(({ contact, formattedAddress, stopType }, index) => ({
      order: index + 1,
      contactId: contact.id,
      name: contactName(contact),
      address: formattedAddress,
      stopType,
    }));

    return NextResponse.json({
      success: true,
      provider: PROVIDER,
      managedBy: "aether",
      organizationId,
      list: {
        id: list.id,
        name: list.name,
      },
      route: {
        distanceMeters: route.distanceMeters ?? null,
        duration: route.duration ?? null,
        encodedPolyline: route.polyline?.encodedPolyline ?? null,
        originAddress,
        destinationAddress: destinationEntry.formattedAddress,
        orderedStops,
      },
      counts: {
        totalContacts: contacts.length,
        routedContacts: routableContacts.length,
        skippedContacts: skippedContacts.length + overflowContacts.length,
      },
      skippedContacts: [...skippedContacts, ...overflowContacts],
    });
  } catch (error: any) {
    console.error("Google Routes generate failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate Google route.",
      },
      { status: 500 },
    );
  }
}
