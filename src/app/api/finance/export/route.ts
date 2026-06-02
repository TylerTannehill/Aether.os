import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ContactExportRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  street?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  occupation?: string | null;
  employer?: string | null;
  donation_total?: number | string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const EXPORT_HEADERS = [
  "first_name",
  "last_name",
  "street_address",
  "city",
  "state",
  "zip",
  "occupation",
  "employer",
  "contribution_amount",
  "contribution_date",
];

function csvEscape(value: unknown) {
  const stringValue = String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function normalizeAmount(value: unknown) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  return amount.toFixed(2);
}

function normalizeDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function buildCsv(rows: ContactExportRow[]) {
  const csvRows = [EXPORT_HEADERS.join(",")];

  for (const contact of rows) {
    const streetAddress = contact.street || contact.address || "";
    const contributionDate = contact.updated_at || contact.created_at || "";

    csvRows.push(
      [
        contact.first_name || "",
        contact.last_name || "",
        streetAddress,
        contact.city || "",
        contact.state || "",
        contact.zip || "",
        contact.occupation || "",
        contact.employer || "",
        normalizeAmount(contact.donation_total),
        normalizeDate(contributionDate),
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return csvRows.join("\n");
}

function buildFileName() {
  const today = new Date().toISOString().slice(0, 10);
  return `aether-finance-fec-export-${today}.csv`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let activeOrganizationId =
      cookieStore.get("active_organization_id")?.value ?? null;

    if (!activeOrganizationId) {
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        return NextResponse.json(
          { error: membershipError.message },
          { status: 500 }
        );
      }

      activeOrganizationId = membership?.organization_id ?? null;
    }

    if (!activeOrganizationId) {
      return NextResponse.json(
        { error: "No active organization selected" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, street, address, city, state, zip, occupation, employer, donation_total, updated_at, created_at"
      )
      .eq("organization_id", activeOrganizationId)
      .gt("donation_total", 0)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const csv = buildCsv((data || []) as ContactExportRow[]);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildFileName()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export finance data" },
      { status: 500 }
    );
  }
}
