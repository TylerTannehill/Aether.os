import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

import {
  calculateDonorTier,
  getLastFecDonationDate,
  hasRecentFecActivity,
} from "@/lib/finance/donor-intelligence";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEC_BASE_URL = "https://api.open.fec.gov/v1/schedules/schedule_a/";
const FEC_PER_PAGE = 100;
const MAX_FEC_PAGES = 10;

type ContactRow = {
  id: string;
  organization_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type FecApiRecord = {
  sub_id?: string | null;
  file_number?: number | string | null;
  contributor_name?: string | null;
  contributor_first_name?: string | null;
  contributor_last_name?: string | null;
  contributor_street_1?: string | null;
  contributor_street_2?: string | null;
  contributor_city?: string | null;
  contributor_state?: string | null;
  contributor_zip?: string | null;
  contributor_employer?: string | null;
  contributor_occupation?: string | null;
  contribution_receipt_amount?: number | null;
  contribution_receipt_date?: string | null;
  committee_id?: string | null;
  committee?: {
    name?: string | null;
  } | null;
  committee_name?: string | null;
  two_year_transaction_period?: number | null;
  entity_type?: string | null;
  is_individual?: boolean | null;
  memoed_subtotal?: boolean | null;
  memo_text?: string | null;
};

type FecApiResponse = {
  results?: FecApiRecord[];
  pagination?: {
    page?: number;
    pages?: number;
    per_page?: number;
    count?: number;
  };
  message?: string;
};

type MatchedRecord = {
  id: string;
  contributor_name: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  employer: string | null;
  occupation: string | null;
  donation_amount: number;
  donation_date: string;
  committee_name: string | null;
  committee_cycle: string | null;
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

function clean(value?: string | null) {
  return String(value || "").trim();
}

function normalizeName(value?: string | null) {
  return clean(value)
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeZip(value?: string | null) {
  const digits = clean(value).replace(/\D/g, "");
  return digits.slice(0, 5);
}

function normalizeStreet(value?: string | null) {
  const replacements: Record<string, string> = {
    STREET: "ST",
    AVENUE: "AVE",
    ROAD: "RD",
    DRIVE: "DR",
    LANE: "LN",
    COURT: "CT",
    BOULEVARD: "BLVD",
    HIGHWAY: "HWY",
    PARKWAY: "PKWY",
    PLACE: "PL",
    TERRACE: "TER",
    CIRCLE: "CIR",
    TRAIL: "TRL",
    NORTH: "N",
    SOUTH: "S",
    EAST: "E",
    WEST: "W",
    NORTHEAST: "NE",
    NORTHWEST: "NW",
    SOUTHEAST: "SE",
    SOUTHWEST: "SW",
    APARTMENT: "APT",
    SUITE: "STE",
  };

  return clean(value)
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,#]/g, " ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => replacements[part] || part)
    .join(" ");
}

function splitContributorName(value?: string | null) {
  const name = clean(value);
  if (!name) return { first: "", last: "" };

  if (name.includes(",")) {
    const [lastPart, firstPart = ""] = name.split(",", 2);
    return {
      first: firstPart.trim().split(/\s+/)[0] || "",
      last: lastPart.trim(),
    };
  }

  const parts = name.split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "",
    last: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}

function fecFirstName(record: FecApiRecord) {
  if (clean(record.contributor_first_name)) {
    return clean(record.contributor_first_name);
  }
  return splitContributorName(record.contributor_name).first;
}

function fecLastName(record: FecApiRecord) {
  if (clean(record.contributor_last_name)) {
    return clean(record.contributor_last_name);
  }
  return splitContributorName(record.contributor_name).last;
}

function isIdentityMatch(contact: ContactRow, record: FecApiRecord) {
  const firstMatches =
    normalizeName(contact.first_name) === normalizeName(fecFirstName(record));
  const lastMatches =
    normalizeName(contact.last_name) === normalizeName(fecLastName(record));
  const streetMatches =
    normalizeStreet(contact.address) ===
    normalizeStreet(record.contributor_street_1);

  if (!firstMatches || !lastMatches || !streetMatches) return false;

  const contactZip = normalizeZip(contact.zip);
  const fecZip = normalizeZip(record.contributor_zip);

  // If both sides have ZIP data, require it to agree too.
  if (contactZip && fecZip && contactZip !== fecZip) return false;

  return true;
}

function matchConfidence(contact: ContactRow, record: FecApiRecord) {
  let score = 90; // exact first + last + normalized street

  const contactZip = normalizeZip(contact.zip);
  const fecZip = normalizeZip(record.contributor_zip);

  if (contactZip && fecZip && contactZip === fecZip) {
    score += 10;
  }

  return Math.min(score, 100);
}

function toMatchedRecord(record: FecApiRecord, index: number): MatchedRecord | null {
  const donationDate = clean(record.contribution_receipt_date);
  const amount = Number(record.contribution_receipt_amount || 0);

  if (!donationDate || !Number.isFinite(amount)) return null;

  return {
    id:
      clean(record.sub_id) ||
      `${clean(record.committee_id) || "fec"}-${donationDate}-${amount}-${index}`,
    contributor_name: clean(record.contributor_name),
    street: clean(record.contributor_street_1) || null,
    city: clean(record.contributor_city) || null,
    state: clean(record.contributor_state) || null,
    zip: clean(record.contributor_zip) || null,
    employer: clean(record.contributor_employer) || null,
    occupation: clean(record.contributor_occupation) || null,
    donation_amount: amount,
    donation_date: donationDate,
    committee_name:
      clean(record.committee_name) ||
      clean(record.committee?.name) ||
      clean(record.committee_id) ||
      null,
    committee_cycle: record.two_year_transaction_period
      ? String(record.two_year_transaction_period)
      : null,
  };
}

async function fetchFecRecords(
  apiKey: string,
  contact: ContactRow,
): Promise<FecApiRecord[]> {
  const allRecords: FecApiRecord[] = [];
  const contributorName = `${clean(contact.first_name)} ${clean(contact.last_name)}`;
  const zip = normalizeZip(contact.zip);

  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({
      api_key: apiKey,
      contributor_name: contributorName,
      is_individual: "true",
      per_page: String(FEC_PER_PAGE),
      page: String(page),
      sort: "-contribution_receipt_date",
    });

    if (zip) {
      params.set("contributor_zip", zip);
    } else if (clean(contact.state)) {
      params.set("contributor_state", clean(contact.state).toUpperCase());
    }

    const response = await fetch(`${FEC_BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | FecApiResponse
      | null;

    if (!response.ok) {
      const message =
        payload?.message ||
        `FEC request failed with HTTP ${response.status}.`;
      throw new Error(message);
    }

    const pageResults = Array.isArray(payload?.results)
      ? payload.results
      : [];

    allRecords.push(...pageResults);

    totalPages = Math.max(
      1,
      Number(payload?.pagination?.pages || 1),
    );

    page += 1;
  } while (page <= totalPages && page <= MAX_FEC_PAGES);

  return allRecords;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FEC_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "FEC_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    const contactId = String(body?.contactId || "").trim();

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: "A contact is required." },
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
      console.error("FEC enrich Aether user lookup failed", appUserError);
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
      console.error("FEC enrich membership lookup failed", membershipError);
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

    const { data: contact, error: contactError } = await databaseClient
      .from("contacts")
      .select(
        "id, organization_id, first_name, last_name, address, city, state, zip",
      )
      .eq("id", contactId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (contactError) {
      console.error("FEC enrich contact lookup failed", contactError);
      return NextResponse.json(
        { success: false, error: contactError.message },
        { status: 500 },
      );
    }

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found in active campaign." },
        { status: 404 },
      );
    }

    const typedContact = contact as ContactRow;

    if (
      !clean(typedContact.first_name) ||
      !clean(typedContact.last_name) ||
      !clean(typedContact.address)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "First name, last name, and street address are required for FEC enrichment.",
        },
        { status: 400 },
      );
    }

    const fecRecords = await fetchFecRecords(apiKey, typedContact);

    const matchedApiRecords = fecRecords.filter((record) =>
      isIdentityMatch(typedContact, record),
    );

    const matchedRecords = matchedApiRecords
      .map((record, index) => toMatchedRecord(record, index))
      .filter((record): record is MatchedRecord => Boolean(record));

    const uniqueRecords = Array.from(
      new Map(matchedRecords.map((record) => [record.id, record])).values(),
    );

    if (!uniqueRecords.length) {
      const { error: updateError } = await databaseClient
        .from("contacts")
        .update({
          fec_match_status: "none",
          fec_confidence_score: null,
          fec_total_given: null,
          fec_last_donation_date: null,
          fec_recent_activity: false,
          fec_donor_tier: "none",
        })
        .eq("id", contactId)
        .eq("organization_id", organizationId);

      if (updateError) {
        console.error("FEC enrich no-match update failed", updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        matched: false,
        matchStatus: "none",
        confidenceScore: null,
        recordCount: 0,
        totalGiven: 0,
        lastDonationDate: null,
        recentActivity: false,
        donorTier: "none",
        records: [],
      });
    }

    const confidenceScore = Math.max(
      ...matchedApiRecords.map((record) =>
        matchConfidence(typedContact, record),
      ),
    );

    const matchStatus = confidenceScore >= 90 ? "matched" : "probable";

    const totalGiven = uniqueRecords.reduce(
      (sum, record) => sum + Number(record.donation_amount || 0),
      0,
    );

    const lastDonationDate = getLastFecDonationDate(
      uniqueRecords.map((record) => ({
        id: record.id,
        contributor_name: record.contributor_name,
        street: record.street,
        city: record.city,
        state: record.state,
        zip: record.zip,
        employer: record.employer,
        occupation: record.occupation,
        donation_amount: record.donation_amount,
        donation_date: record.donation_date,
        committee_name: record.committee_name,
        committee_cycle: record.committee_cycle,
      })),
    );

    const recentActivity = hasRecentFecActivity(lastDonationDate);
    const donorTier = calculateDonorTier({
      fecTotalGiven: totalGiven,
      directContributionTotal: 0,
    });

    const { error: updateError } = await databaseClient
      .from("contacts")
      .update({
        fec_match_status: matchStatus,
        fec_confidence_score: confidenceScore,
        fec_total_given: totalGiven,
        fec_last_donation_date: lastDonationDate,
        fec_recent_activity: recentActivity,
        fec_donor_tier: donorTier,
      })
      .eq("id", contactId)
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("FEC enrich contact update failed", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      matched: true,
      matchStatus,
      confidenceScore,
      recordCount: uniqueRecords.length,
      totalGiven,
      lastDonationDate,
      recentActivity,
      donorTier,
      records: uniqueRecords,
    });
  } catch (error) {
    console.error("FEC enrich failed", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "FEC enrichment failed.",
      },
      { status: 500 },
    );
  }
}
