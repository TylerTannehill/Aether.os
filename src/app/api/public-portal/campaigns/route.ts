import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type MetricKey =
  | "doors"
  | "impressions"
  | "raised"
  | "print"
  | "financeCalls"
  | "outreachCalls";

type PublicCampaign = {
  id: string;
  name: string;
  state: string;
  office: string;
  district?: string;
  website?: string;
  donateUrl?: string;
  metrics: Partial<Record<MetricKey, number>>;
};

type PublicPortalSettingsRow = {
  organization_id: string;
  enabled: boolean;
  show_doors: boolean;
  show_digital_impressions: boolean;
  show_total_raised: boolean;
  show_print_materials: boolean;
  show_finance_calls: boolean;
  show_outreach_calls: boolean;
  campaign_website_url: string | null;
  donation_url: string | null;
  state: string | null;
  office: string | null;
  district: string | null;
};

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isWorkedContact(row: any) {
  return Boolean(
    row?.disposition ||
      row?.notes ||
      String(row?.status || "").toLowerCase() === "completed" ||
      row?.completed_at
  );
}

async function getWorkedCounts(
  organizationId: string
): Promise<{ doors: number; financeCalls: number; outreachCalls: number }> {
  const { data: lists, error: listsError } = await supabaseAdmin
    .from("lists")
    .select("id, type")
    .eq("organization_id", organizationId)
    .in("type", ["field", "finance", "outreach"]);

  if (listsError) throw listsError;

  const relevantLists = lists ?? [];
  if (relevantLists.length === 0) {
    return { doors: 0, financeCalls: 0, outreachCalls: 0 };
  }

  const listTypeById = new Map<string, string>();
  for (const list of relevantLists) {
    listTypeById.set(String(list.id), String(list.type || "").toLowerCase());
  }

  const listIds = relevantLists.map((list) => list.id);

  const { data: listContacts, error: listContactsError } = await supabaseAdmin
    .from("list_contacts")
    .select("list_id, disposition, notes, status, completed_at")
    .in("list_id", listIds);

  if (listContactsError) throw listContactsError;

  let doors = 0;
  let financeCalls = 0;
  let outreachCalls = 0;

  for (const row of listContacts ?? []) {
    if (!isWorkedContact(row)) continue;

    const type = listTypeById.get(String(row.list_id));

    if (type === "field") doors += 1;
    else if (type === "finance") financeCalls += 1;
    else if (type === "outreach") outreachCalls += 1;
  }

  return { doors, financeCalls, outreachCalls };
}

async function getTotalRaised(organizationId: string) {
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("amount")
    .eq("organization_id", organizationId);

  if (error) throw error;

  return (data ?? []).reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
}

async function getPrintOnHand(organizationId: string) {
  const { data, error } = await supabaseAdmin
    .from("print_metrics")
    .select("on_hand")
    .eq("organization_id", organizationId);

  if (error) throw error;

  return (data ?? []).reduce(
    (sum, row) => sum + numberValue(row.on_hand),
    0
  );
}

async function getDigitalImpressions(organizationId: string) {
  const { data: analyticsRows, error: analyticsError } = await supabaseAdmin
    .from("analytics_events")
    .select("impressions")
    .eq("organization_id", organizationId);

  if (analyticsError) throw analyticsError;

  if ((analyticsRows ?? []).length > 0) {
    return (analyticsRows ?? []).reduce(
      (sum, row) => sum + numberValue(row.impressions),
      0
    );
  }

  const { data: legacyRows, error: legacyError } = await supabaseAdmin
    .from("digital_metrics")
    .select("impressions")
    .eq("organization_id", organizationId);

  if (legacyError) throw legacyError;

  return (legacyRows ?? []).reduce(
    (sum, row) => sum + numberValue(row.impressions),
    0
  );
}

export async function GET() {
  try {
    const { data: settingsRows, error: settingsError } = await supabaseAdmin
      .from("public_campaign_portal_settings")
      .select("*")
      .eq("enabled", true);

    if (settingsError) {
      return NextResponse.json(
        { success: false, error: settingsError.message },
        { status: 500 }
      );
    }

    const settings = (settingsRows ?? []) as PublicPortalSettingsRow[];

    if (settings.length === 0) {
      return NextResponse.json(
        { success: true, campaigns: [] },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const organizationIds = settings.map((row) => String(row.organization_id));

    const { data: organizations, error: organizationsError } =
      await supabaseAdmin
        .from("organizations")
        .select("id, name")
        .in("id", organizationIds);

    if (organizationsError) {
      return NextResponse.json(
        { success: false, error: organizationsError.message },
        { status: 500 }
      );
    }

    const organizationNameById = new Map<string, string>();

    for (const organization of organizations ?? []) {
      organizationNameById.set(
        String(organization.id),
        String(organization.name || "Campaign")
      );
    }

    const campaigns = await Promise.all(
      settings.map(async (setting): Promise<PublicCampaign> => {
        const organizationId = String(setting.organization_id);
        const metrics: Partial<Record<MetricKey, number>> = {};

        const needsWorkedCounts =
          Boolean(setting.show_doors) ||
          Boolean(setting.show_finance_calls) ||
          Boolean(setting.show_outreach_calls);

        const [workedCounts, impressions, raised, printOnHand] =
          await Promise.all([
            needsWorkedCounts
              ? getWorkedCounts(organizationId)
              : Promise.resolve({
                  doors: 0,
                  financeCalls: 0,
                  outreachCalls: 0,
                }),
            setting.show_digital_impressions
              ? getDigitalImpressions(organizationId)
              : Promise.resolve(0),
            setting.show_total_raised
              ? getTotalRaised(organizationId)
              : Promise.resolve(0),
            setting.show_print_materials
              ? getPrintOnHand(organizationId)
              : Promise.resolve(0),
          ]);

        if (setting.show_doors) {
          metrics.doors = workedCounts.doors;
        }

        if (setting.show_digital_impressions) {
          metrics.impressions = impressions;
        }

        if (setting.show_total_raised) {
          metrics.raised = raised;
        }

        if (setting.show_print_materials) {
          metrics.print = printOnHand;
        }

        if (setting.show_finance_calls) {
          metrics.financeCalls = workedCounts.financeCalls;
        }

        if (setting.show_outreach_calls) {
          metrics.outreachCalls = workedCounts.outreachCalls;
        }

        const campaign: PublicCampaign = {
          id: organizationId,
          name: organizationNameById.get(organizationId) || "Campaign",
          state: String(setting.state || ""),
          office: String(setting.office || ""),
          metrics,
        };

        if (setting.district) {
          campaign.district = String(setting.district);
        }

        if (setting.campaign_website_url) {
          campaign.website = String(setting.campaign_website_url);
        }

        if (setting.donation_url) {
          campaign.donateUrl = String(setting.donation_url);
        }

        return campaign;
      })
    );

    campaigns.sort((a, b) => {
      const stateCompare = a.state.localeCompare(b.state);
      if (stateCompare !== 0) return stateCompare;

      const officeCompare = a.office.localeCompare(b.office);
      if (officeCompare !== 0) return officeCompare;

      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(
      {
        success: true,
        campaigns,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load public campaign data.",
      },
      { status: 500 }
    );
  }
}
