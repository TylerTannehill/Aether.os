import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ANALYTICS_SOURCE_SLUG = "aether-demo-campaign";

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function platformKey(value: unknown) {
  const normalized = normalize(value);

  if (
    normalized === "campaign website" ||
    normalized === "website" ||
    normalized === "campaign domain"
  ) {
    return "website";
  }

  if (normalized === "meta" || normalized === "facebook") return "meta";
  if (normalized === "instagram" || normalized === "ig") return "instagram";
  if (normalized === "x" || normalized === "twitter") return "x";
  if (normalized === "tiktok" || normalized === "tik tok") return "tiktok";
  if (normalized === "youtube" || normalized === "you tube") return "youtube";

  return null;
}

function getEngagement(row: Record<string, any>) {
  return toNumber(row.engagement ?? row.engagements ?? row.interactions);
}

function getPageViews(row: Record<string, any>) {
  return toNumber(
    row.page_views ??
      row.pageviews ??
      row.views ??
      row.impressions
  );
}

function getClicks(row: Record<string, any>) {
  return toNumber(row.clicks);
}

function emptyMetrics() {
  return {
    website: {
      pageViews: 0,
      engagements: 0,
      clicks: 0,
    },
    meta: {
      followers: 0,
      reach: 0,
      engagement: 0,
    },
    instagram: {
      followers: 0,
      reach: 0,
      engagement: 0,
    },
    x: {
      followers: 0,
      impressions: 0,
      engagement: 0,
    },
    tiktok: {
      followers: 0,
      views: 0,
      engagement: 0,
    },
    youtube: {
      subscribers: 0,
      views: 0,
      watchTime: 0,
    },
  };
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase service configuration is missing.",
        },
        { status: 500 }
      );
    }

    const serviceSupabase = createServiceClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: appUser, error: appUserError } = await serviceSupabase
      .from("users")
      .select("id, auth_id, is_active")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (appUserError) {
      console.error("Team Aether analytics user lookup failed", appUserError);

      return NextResponse.json(
        {
          success: false,
          error: appUserError.message,
        },
        { status: 500 }
      );
    }

    if (!appUser || appUser.is_active === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Aether user profile is not active.",
        },
        { status: 403 }
      );
    }

    const { data: analyticsSourceOrg, error: organizationError } =
      await serviceSupabase
        .from("organizations")
        .select("id, name, slug, status")
        .eq("slug", ANALYTICS_SOURCE_SLUG)
        .maybeSingle();

    if (organizationError) {
      console.error(
        "Team Aether analytics organization lookup failed",
        organizationError
      );

      return NextResponse.json(
        {
          success: false,
          error: organizationError.message,
        },
        { status: 500 }
      );
    }

    if (!analyticsSourceOrg) {
      return NextResponse.json(
        {
          success: false,
          error: "Aether analytics source organization was not found.",
        },
        { status: 404 }
      );
    }

    if (
      analyticsSourceOrg.status &&
      String(analyticsSourceOrg.status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Aether analytics source organization is not active.",
        },
        { status: 403 }
      );
    }

    // Team Aether access is checked independently from the analytics source.
    const { data: teamAetherOrg, error: teamAetherOrgError } =
      await serviceSupabase
        .from("organizations")
        .select("id")
        .eq("slug", "team-aether")
        .maybeSingle();

    if (teamAetherOrgError || !teamAetherOrg) {
      return NextResponse.json(
        {
          success: false,
          error:
            teamAetherOrgError?.message ||
            "Team Aether organization was not found.",
        },
        { status: teamAetherOrgError ? 500 : 404 }
      );
    }

    const { data: membership, error: membershipError } =
      await serviceSupabase
        .from("organization_members")
        .select("organization_id, profile_status")
        .eq("organization_id", teamAetherOrg.id)
        .eq("user_id", appUser.id)
        .maybeSingle();

    if (membershipError) {
      console.error(
        "Team Aether analytics membership lookup failed",
        membershipError
      );

      return NextResponse.json(
        {
          success: false,
          error: membershipError.message,
        },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to Team Aether.",
        },
        { status: 403 }
      );
    }

    if (
      membership.profile_status &&
      String(membership.profile_status).toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Your Team Aether access is not active.",
        },
        { status: 403 }
      );
    }

    const { data: rows, error: analyticsError } = await serviceSupabase
      .from("analytics_events")
      .select("*")
      .eq("organization_id", analyticsSourceOrg.id)
      .order("metric_date", { ascending: false });

    if (analyticsError) {
      console.error(
        "Team Aether analytics_events lookup failed",
        analyticsError
      );

      return NextResponse.json(
        {
          success: false,
          error: analyticsError.message,
        },
        { status: 500 }
      );
    }

    const metrics = emptyMetrics();
    const analyticsRows = (rows as Record<string, any>[]) ?? [];

    for (const row of analyticsRows) {
      const key = platformKey(row.platform ?? row.source);

      if (!key) continue;

      if (key === "website") {
        metrics.website.pageViews += getPageViews(row);
        metrics.website.engagements += getEngagement(row);
        metrics.website.clicks += getClicks(row);
        continue;
      }

      if (key === "meta") {
        metrics.meta.followers += toNumber(
          row.followers ?? row.follower_count
        );
        metrics.meta.reach += toNumber(
          row.reach ?? row.impressions
        );
        metrics.meta.engagement += getEngagement(row);
        continue;
      }

      if (key === "instagram") {
        metrics.instagram.followers += toNumber(
          row.followers ?? row.follower_count
        );
        metrics.instagram.reach += toNumber(
          row.reach ?? row.impressions
        );
        metrics.instagram.engagement += getEngagement(row);
        continue;
      }

      if (key === "x") {
        metrics.x.followers += toNumber(
          row.followers ?? row.follower_count
        );
        metrics.x.impressions += toNumber(row.impressions);
        metrics.x.engagement += getEngagement(row);
        continue;
      }

      if (key === "tiktok") {
        metrics.tiktok.followers += toNumber(
          row.followers ?? row.follower_count
        );
        metrics.tiktok.views += toNumber(
          row.views ?? row.impressions
        );
        metrics.tiktok.engagement += getEngagement(row);
        continue;
      }

      if (key === "youtube") {
        metrics.youtube.subscribers += toNumber(
          row.subscribers ?? row.subscriber_count ?? row.followers
        );
        metrics.youtube.views += toNumber(
          row.views ?? row.impressions
        );
        metrics.youtube.watchTime += toNumber(
          row.watch_time ?? row.watch_time_minutes ?? row.watch_minutes
        );
      }
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: analyticsSourceOrg.id,
        name: analyticsSourceOrg.name,
        slug: analyticsSourceOrg.slug,
      },
      rowCount: analyticsRows.length,
      metrics,
    });
  } catch (error: any) {
    console.error("Team Aether analytics failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load Team Aether analytics.",
      },
      { status: 500 }
    );
  }
}
