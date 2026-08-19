import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getConnection } from "@/lib/integrations/connection-store";
import { ingestContactsForOrganization } from "@/lib/ingestion/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER = "actblue";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin environment variables are missing.");
  return createSupabaseAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function asObject(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function first(sources: Array<Record<string, any> | null>, keys: string[]) {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
  }
  return null;
}

function amount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number" ? value : Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeActBlue(payload: Record<string, any>) {
  const contribution =
    asObject(payload.contribution) ??
    asObject(payload.donation) ??
    asObject(payload.transaction) ??
    payload;

  const donor =
    asObject(contribution.donor) ??
    asObject(contribution.person) ??
    asObject(contribution.contributor) ??
    asObject(payload.donor) ??
    asObject(payload.person) ??
    asObject(payload.contributor);

  const address =
    asObject(donor?.address) ??
    asObject(donor?.billing_address) ??
    asObject(contribution.billing_address) ??
    asObject(contribution.address) ??
    asObject(payload.address);

  const personSources = [donor, contribution, payload];
  const addressSources = [address, donor, contribution, payload];

  return {
    first_name: first(personSources, ["first_name", "firstname", "firstName", "donor_first_name"]),
    last_name: first(personSources, ["last_name", "lastname", "lastName", "donor_last_name"]),
    email: first(personSources, ["email", "email_address", "emailAddress", "donor_email"]),
    phone: first(personSources, ["phone", "phone_number", "phoneNumber", "mobile", "donor_phone"]),
    address: first(addressSources, ["address", "address1", "address_1", "street", "street_address", "line1", "line_1"]),
    city: first(addressSources, ["city"]),
    state: first(addressSources, ["state", "state_code", "stateCode"]),
    zip: first(addressSources, ["zip", "zipcode", "zip_code", "postal_code", "postalCode"]),
    donation_amount: amount(first([contribution, payload], [
      "amount", "donation_amount", "contribution_amount", "contributionAmount", "total",
    ])),
  };
}

function normalizeEmail(value: unknown): string | null {
  const cleaned = String(value ?? "").trim().toLowerCase();
  return cleaned && cleaned.includes("@") ? cleaned : null;
}

function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

async function currentDonationTotal(
  organizationId: string,
  normalized: Record<string, any>,
): Promise<number> {
  const admin = getAdminClient();

  const normalizedEmail = normalizeEmail(normalized.email);
  const normalizedPhone = normalizePhone(normalized.phone);

  if (normalizedEmail) {
    const { data, error } = await admin
      .from("contacts")
      .select("donation_total")
      .eq("organization_id", organizationId)
      .ilike("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Unable to check existing ActBlue donor: ${error.message}`);
    if (data) return amount(data.donation_total) ?? 0;
  }

  if (normalizedPhone) {
    const { data, error } = await admin
      .from("contacts")
      .select("phone, donation_total")
      .eq("organization_id", organizationId);

    if (error) throw new Error(`Unable to check existing ActBlue donor: ${error.message}`);

    const match = (data ?? []).find(
      (contact: any) => normalizePhone(contact.phone) === normalizedPhone,
    );

    if (match) return amount(match.donation_total) ?? 0;
  }

  return 0;
}

async function findIntegration(token: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("organization_integrations")
    .select("*")
    .eq("provider", PROVIDER)
    .eq("status", "connected");

  if (error) throw new Error(`Unable to load ActBlue integrations: ${error.message}`);

  return (data ?? []).find((row: any) => {
    const stored =
      row?.metadata?.webhook_token ??
      row?.metadata?.webhookToken ??
      row?.metadata?.token;
    return stored === token || row?.access_token === token;
  }) ?? null;
}

export async function POST(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { success: false, provider: PROVIDER, error: "Missing webhook token." },
        { status: 401 },
      );
    }

    const integration = await findIntegration(token);

    if (!integration?.organization_id) {
      return NextResponse.json(
        { success: false, provider: PROVIDER, error: "Invalid or inactive ActBlue webhook token." },
        { status: 401 },
      );
    }

    const connection = await getConnection(integration.organization_id, PROVIDER);
    if (!connection || connection.status !== "connected") {
      return NextResponse.json(
        { success: false, provider: PROVIDER, error: "ActBlue connection is not active." },
        { status: 403 },
      );
    }

    let payload: Record<string, any>;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, provider: PROVIDER, error: "Webhook payload must be valid JSON." },
        { status: 400 },
      );
    }

    console.log("[ACTBLUE WEBHOOK] Payload received", {
      organizationId: integration.organization_id,
      receivedAt: new Date().toISOString(),
      payload,
    });

    const normalized = normalizeActBlue(payload);

    // ActBlue webhook amounts represent the incoming contribution event.
    // Aether Contacts stores the donor's cumulative donation_total, so add
    // the new contribution to any amount already stored for this donor.
    const incomingContribution = amount(normalized.donation_amount);

    if (incomingContribution !== null) {
      const existingTotal = await currentDonationTotal(
        integration.organization_id,
        normalized,
      );

      normalized.donation_amount = existingTotal + incomingContribution;
    }

    const ingestion = await ingestContactsForOrganization(
      getAdminClient(),
      integration.organization_id,
      [normalized],
    );

    if (ingestion.errors.length > 0) {
      console.error("[ACTBLUE WEBHOOK] Contact ingestion errors", {
        organizationId: integration.organization_id,
        errors: ingestion.errors,
      });
    }

    return NextResponse.json({
      success: ingestion.errors.length === 0,
      provider: PROVIDER,
      received: true,
      organizationId: integration.organization_id,
      ingestion,
      message:
        ingestion.errors.length === 0
          ? "ActBlue webhook received and processed through Aether Contacts."
          : "ActBlue webhook was received, but contact ingestion reported errors.",
    });
  } catch (error: any) {
    console.error("[ACTBLUE WEBHOOK] Failed", error);
    return NextResponse.json(
      { success: false, provider: PROVIDER, error: error?.message || "ActBlue webhook failed." },
      { status: 500 },
    );
  }
}
