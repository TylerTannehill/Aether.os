import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EMPTY_MEMORY = {
  recentPrimaryLanes: [],
  recentPressureLanes: [],
  recentOpportunityLanes: [],
  recentCrossDomainSignals: [],
};

async function resolveActiveOrganizationId(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const cookieStore = await cookies();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated.");
  }

  let activeOrganizationId =
    cookieStore.get("active_organization_id")?.value;

  if (!activeOrganizationId) {
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership?.organization_id) {
      throw new Error("No active campaign selected.");
    }

    activeOrganizationId = membership.organization_id;
  }

  const { data: membership, error: accessError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", activeOrganizationId)
    .maybeSingle();

  if (accessError) throw accessError;

  if (!membership) {
    throw new Error("You do not have access to this campaign.");
  }

  return activeOrganizationId;
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toAbeMemory(row: any) {
  if (!row) return EMPTY_MEMORY;

  return {
    previousPrimaryLane: row.previous_primary_lane ?? undefined,
    previousStrongest: row.previous_strongest ?? undefined,
    previousWeakest: row.previous_weakest ?? undefined,
    previousHealth: row.previous_health ?? undefined,
    previousCampaignStatus: row.previous_campaign_status ?? undefined,
    recentPrimaryLanes: normalizeArray(row.recent_primary_lanes),
    recentPressureLanes: normalizeArray(row.recent_pressure_lanes),
    recentOpportunityLanes: normalizeArray(row.recent_opportunity_lanes),
    recentCrossDomainSignals: normalizeArray(
      row.recent_cross_domain_signals
    ),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const organizationId = await resolveActiveOrganizationId(supabase);

    const { data, error } = await supabase
      .from("abe_org_memory")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      memory: toAbeMemory(data),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load Abe memory" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const memory = body?.memory ?? {};

    const supabase = await createClient();
    const organizationId = await resolveActiveOrganizationId(supabase);

    const payload = {
      organization_id: organizationId,
      previous_primary_lane: memory.previousPrimaryLane ?? null,
      previous_strongest: memory.previousStrongest ?? null,
      previous_weakest: memory.previousWeakest ?? null,
      previous_health: memory.previousHealth ?? null,
      previous_campaign_status: memory.previousCampaignStatus ?? null,
      recent_primary_lanes: normalizeArray(memory.recentPrimaryLanes),
      recent_pressure_lanes: normalizeArray(memory.recentPressureLanes),
      recent_opportunity_lanes: normalizeArray(
        memory.recentOpportunityLanes
      ),
      recent_cross_domain_signals: normalizeArray(
        memory.recentCrossDomainSignals
      ),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("abe_org_memory")
      .upsert(payload, { onConflict: "organization_id" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save Abe memory" },
      { status: 500 }
    );
  }
}