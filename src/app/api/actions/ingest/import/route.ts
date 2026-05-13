import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

const ALLOWED_CONTACT_COLUMNS = [
  "first_name",
  "last_name",
  "phone",
  "email",
  "address",
  "occupation",
  "employer",
  "city",
  "state",
  "party",
  "contact_code",
  "organization_id",
  "owner_name",
  "full_name",
  "fec_match_status",
  "fec_confidence_score",
  "fec_total_given",
  "fec_last_donation_date",
  "fec_recent_activity",
  "fec_donor_tier",
  "jackpot_candidate",
  "jackpot_anomaly_type",
  "jackpot_reason",
];

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function cleanString(value: unknown) {
  const cleaned = String(value ?? "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return null;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);

  return digits;
}

function normalizeEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

function normalizeState(value: unknown) {
  const state = String(value || "").trim();
  if (!state) return null;

  const normalized = state.toLowerCase();
  const stateMap: Record<string, string> = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
  };

  return state.length === 2 ? state.toUpperCase() : stateMap[normalized] || state;
}

function normalizeZip(value: unknown) {
  const zip = String(value || "").replace(/\D/g, "").slice(0, 5);
  return zip || null;
}

function splitName(value: unknown) {
  const normalized = normalizeText(value);
  const parts = normalized.split(" ").filter(Boolean);

  return {
    first: parts[0] || "",
    last: parts.length > 1 ? parts[parts.length - 1] : "",
    full: normalized,
  };
}

function donationTotal(contact: Record<string, any>) {
  const value = Number(contact.donation_total ?? contact.fec_total_given ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

function calculateDonorTier(totalGiven: number) {
  if (totalGiven >= 6600) return "maxed";
  if (totalGiven >= 2500) return "major";
  if (totalGiven >= 500) return "mid";
  if (totalGiven > 0) return "base";
  return "none";
}

function normalizeImportedContact(contact: Record<string, any>) {
  const normalized: Record<string, any> = {};

  Object.entries(contact).forEach(([key, value]) => {
    if (ALLOWED_CONTACT_COLUMNS.includes(key)) {
      normalized[key] = value;
    }
  });

  Object.entries(normalized).forEach(([key, value]) => {
    if (typeof value === "string") {
      normalized[key] = value.trim();
    }
  });

  const full = cleanString(normalized.full_name);
  if (full && (!normalized.first_name || !normalized.last_name)) {
    const parts = String(full).trim().split(/\s+/).filter(Boolean);

    if (!normalized.first_name && parts[0]) {
      normalized.first_name = parts[0];
    }

    if (!normalized.last_name && parts.length > 1) {
      normalized.last_name = parts[parts.length - 1];
    }
  }

  delete normalized.full_name;

  if ("first_name" in normalized) normalized.first_name = cleanString(normalized.first_name);
  if ("last_name" in normalized) normalized.last_name = cleanString(normalized.last_name);
  if ("phone" in normalized) normalized.phone = normalizePhone(normalized.phone);
  if ("email" in normalized) normalized.email = normalizeEmail(normalized.email);
  if ("city" in normalized) normalized.city = cleanString(normalized.city);
  if ("state" in normalized) normalized.state = normalizeState(normalized.state);
  if ("zip" in normalized) normalized.zip = normalizeZip(normalized.zip);
  if ("owner_name" in normalized) normalized.owner_name = cleanString(normalized.owner_name);

  if ("donation_total" in normalized) {
    const total = Number(normalized.donation_total || 0);
    normalized.donation_total = Number.isNaN(total) ? 0 : total;
  }

  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === "") normalized[key] = null;
  });

  return normalized;
}

function buildContactSearchKey(contact: Record<string, any>) {
  const email = normalizeEmail(contact.email);
  if (email) return `email:${email}`;

  const phone = normalizePhone(contact.phone);
  if (phone) return `phone:${phone}`;

  const first = normalizeText(contact.first_name);
  const last = normalizeText(contact.last_name);
  const city = normalizeText(contact.city);
  const state = normalizeText(contact.state);
  const zip = normalizeZip(contact.zip);

  if (first && last && zip) return `name_zip:${first}:${last}:${zip}`;
  if (first && last && city && state) return `name_city_state:${first}:${last}:${city}:${state}`;
  if (first && last) return `name:${first}:${last}`;

  return null;
}

function buildExistingContactIndex(contacts: Record<string, any>[]) {
  const index = new Map<string, Record<string, any>>();

  contacts.forEach((contact) => {
    const email = normalizeEmail(contact.email);
    const phone = normalizePhone(contact.phone);
    const first = normalizeText(contact.first_name);
    const last = normalizeText(contact.last_name);
    const city = normalizeText(contact.city);
    const state = normalizeText(contact.state);
    const zip = normalizeZip(contact.zip);

    if (email) index.set(`email:${email}`, contact);
    if (phone) index.set(`phone:${phone}`, contact);
    if (first && last && zip) index.set(`name_zip:${first}:${last}:${zip}`, contact);
    if (first && last && city && state) index.set(`name_city_state:${first}:${last}:${city}:${state}`, contact);
    if (first && last) index.set(`name:${first}:${last}`, contact);
  });

  return index;
}

function mergeContact(existing: Record<string, any>, incoming: Record<string, any>) {
  const merged: Record<string, any> = {};

  Object.entries(incoming).forEach(([key, value]) => {
    if (key === "id") return;
    if (key === "organization_id") return;

    const existingValue = existing[key];

    if (key === "donation_total") {
      const existingTotal = Number(existingValue || 0);
      const incomingTotal = Number(value || 0);
      merged[key] = Math.max(
        Number.isNaN(existingTotal) ? 0 : existingTotal,
        Number.isNaN(incomingTotal) ? 0 : incomingTotal
      );
      return;
    }

    if (!isBlank(value)) {
      merged[key] = value;
    } else if (!isBlank(existingValue)) {
      merged[key] = existingValue;
    }
  });

  return merged;
}

function buildMatchScore(contact: Record<string, any>, fecRecord: Record<string, any>) {
  const contactName = splitName(
    [contact.first_name, contact.last_name].filter(Boolean).join(" ")
  );
  const fecName = splitName(
    fecRecord.contributor_name ||
      [fecRecord.contributor_first_name, fecRecord.contributor_last_name]
        .filter(Boolean)
        .join(" ")
  );

  let score = 0;
  const matchedOn: string[] = [];

  if (contactName.full && fecName.full && contactName.full === fecName.full) {
    score += 45;
    matchedOn.push("full_name");
  } else {
    if (contactName.first && contactName.first === fecName.first) {
      score += 15;
      matchedOn.push("first_name");
    }

    if (contactName.last && contactName.last === fecName.last) {
      score += 30;
      matchedOn.push("last_name");
    }
  }

  if (
    contact.city &&
    fecRecord.city &&
    normalizeText(contact.city) === normalizeText(fecRecord.city)
  ) {
    score += 10;
    matchedOn.push("city");
  }

  if (
    contact.state &&
    fecRecord.state &&
    normalizeText(contact.state) === normalizeText(fecRecord.state)
  ) {
    score += 5;
    matchedOn.push("state");
  }

  if (
    contact.zip &&
    fecRecord.zip &&
    normalizeZip(contact.zip) === normalizeZip(fecRecord.zip)
  ) {
    score += 10;
    matchedOn.push("zip");
  }

  const contactAddress = contact.address || contact.street;

  if (
    contactAddress &&
    fecRecord.street &&
    normalizeText(contactAddress) === normalizeText(fecRecord.street)
  ) {
    score += 15;
    matchedOn.push("address");
  }

  return {
    confidence_score: Math.min(score, 100),
    matched_on: matchedOn,
  };
}

function getMatchStatus(score: number) {
  if (score >= 85) return "matched";
  if (score >= 60) return "probable";
  if (score > 0) return "unresolved";
  return "none";
}

async function resolveActiveOrganizationId(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get("active_organization_id")?.value;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated.");
  }

  if (!activeOrganizationId) {
    throw new Error("No active campaign selected.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", activeOrganizationId)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (!membership) {
    throw new Error("You do not have access to this campaign.");
  }

  return activeOrganizationId;
}

async function upsertContactsSafely(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contacts: Record<string, any>[],
  organizationId: string
) {
  const normalizedContacts: Record<string, any>[] = contacts
    .map((rawContact: Record<string, any>) => normalizeImportedContact(rawContact))
    .map((contact: Record<string, any>) => ({
      ...contact,
      organization_id: organizationId,
    }))
    .filter((contact: Record<string, any>) => {
      return (
        !isBlank(contact.first_name) ||
        !isBlank(contact.last_name) ||
        !isBlank(contact.email) ||
        !isBlank(contact.phone)
      );
    });

  if (normalizedContacts.length === 0) {
    return [] as Record<string, any>[];
  }

  const { data: existingContacts, error: existingError } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId);

  if (existingError) throw existingError;

  const index = buildExistingContactIndex((existingContacts as Record<string, any>[]) || []);
  const savedContacts: Record<string, any>[] = [];

  for (const contact of normalizedContacts) {
    const key = buildContactSearchKey(contact);
    const existing = key ? index.get(key) : null;

    if (existing?.id) {
      const merged = {
        ...mergeContact(existing, contact),
        organization_id: organizationId,
      };

      const { data: updated, error: updateError } = await supabase
        .from("contacts")
        .update(merged)
        .eq("id", existing.id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (updated) {
        savedContacts.push(updated);

        const updatedKeys = [
          buildContactSearchKey(updated),
          normalizeEmail(updated.email) ? `email:${normalizeEmail(updated.email)}` : null,
          normalizePhone(updated.phone) ? `phone:${normalizePhone(updated.phone)}` : null,
        ].filter(Boolean) as string[];

        updatedKeys.forEach((updatedKey) => index.set(updatedKey, updated));
      }

      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert([contact])
      .select()
      .single();

    if (insertError) throw insertError;

    if (inserted) {
      savedContacts.push(inserted);

      const insertedKeys = [
        buildContactSearchKey(inserted),
        normalizeEmail(inserted.email) ? `email:${normalizeEmail(inserted.email)}` : null,
        normalizePhone(inserted.phone) ? `phone:${normalizePhone(inserted.phone)}` : null,
      ].filter(Boolean) as string[];

      insertedKeys.forEach((insertedKey) => index.set(insertedKey, inserted));
    }
  }

  return savedContacts;
}

async function getOrCreateSuggestedLists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  suggestedLists: string[],
  organizationId: string
) {
  const uniqueNames = Array.from(
    new Set(suggestedLists.map((name) => String(name || "").trim()).filter(Boolean))
  );

  if (uniqueNames.length === 0) return [] as Record<string, any>[];

  const { data: existingLists, error: existingError } = await supabase
    .from("lists")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("name", uniqueNames);

  if (existingError) throw existingError;

  const existingByName = new Map(
    ((existingLists as Record<string, any>[]) || []).map((list) => [String(list.name), list])
  );

  const missingNames = uniqueNames.filter((name) => !existingByName.has(name));
  let createdLists: Record<string, any>[] = [];

  if (missingNames.length > 0) {
    const { data: insertedLists, error: insertError } = await supabase
      .from("lists")
      .insert(
        missingNames.map((name) => ({
          name,
          organization_id: organizationId,
        }))
      )
      .select("id, name");

    if (insertError) throw insertError;
    createdLists = (insertedLists as Record<string, any>[]) || [];
  }

  return [...((existingLists as Record<string, any>[]) || []), ...createdLists];
}

function buildFecImportBatchId() {
  return `fec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts = Array.isArray(body.contacts) ? body.contacts : [];
    const fecRecords = Array.isArray(body.fecRecords ?? body.records)
      ? body.fecRecords ?? body.records
      : [];
    const suggestedLists: string[] = Array.isArray(body.suggestedLists)
      ? body.suggestedLists
      : [];
    const source: string = body.source ?? "outreach";

    const supabase = await createClient();
    const organizationId = await resolveActiveOrganizationId(supabase);

    if (source === "fec") {
      if (!Array.isArray(fecRecords) || fecRecords.length === 0) {
        return NextResponse.json(
          { error: "No FEC records provided for import." },
          { status: 400 }
        );
      }

      const batchId = buildFecImportBatchId();

      const sanitizedRecords = fecRecords
        .map((record: Record<string, any>) => ({
          organization_id: organizationId,
          source_file_id: cleanString(record.source_file_id),
          source_record_id: cleanString(record.source_record_id),
          import_batch_id: record.import_batch_id || batchId,
          contributor_name: String(record.contributor_name || "").trim(),
          contributor_first_name: cleanString(record.contributor_first_name),
          contributor_last_name: cleanString(record.contributor_last_name),
          street: cleanString(record.street),
          city: cleanString(record.city),
          state: normalizeState(record.state),
          zip: normalizeZip(record.zip),
          employer: cleanString(record.employer),
          occupation: cleanString(record.occupation),
          donation_amount: Number(record.donation_amount || 0),
          donation_date:
            record.donation_date || new Date().toISOString().slice(0, 10),
          committee_name: cleanString(record.committee_name),
          committee_cycle: cleanString(record.committee_cycle),
          raw_payload: record.raw_payload || record,
        }))
        .filter((record: Record<string, any>) => record.contributor_name);

      const { data: insertedFecRecords, error: fecError } = await supabase
        .from("fec_raw_records")
        .insert(sanitizedRecords)
        .select();

      if (fecError) {
        return NextResponse.json({ error: fecError.message }, { status: 500 });
      }

      const { data: existingContacts, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", organizationId);

      if (contactsError) {
        return NextResponse.json(
          { error: contactsError.message },
          { status: 500 }
        );
      }

      const matchInserts: Record<string, any>[] = [];
      const contactTotals = new Map<string, number>();
      const contactLastGift = new Map<string, string>();
      const contactBestScore = new Map<string, number>();
      const contactBestStatus = new Map<string, string>();

      for (const fecRecord of insertedFecRecords || []) {
        let bestContact: Record<string, any> | null = null;
        let bestScore = 0;
        let bestMatchedOn: string[] = [];

        for (const contact of existingContacts || []) {
          const result = buildMatchScore(contact, fecRecord);

          if (result.confidence_score > bestScore) {
            bestScore = result.confidence_score;
            bestMatchedOn = result.matched_on;
            bestContact = contact;
          }
        }

        if (!bestContact || bestScore < 60) continue;

        const matchStatus = getMatchStatus(bestScore);

        matchInserts.push({
          organization_id: organizationId,
          contact_id: bestContact.id,
          fec_record_id: fecRecord.id,
          match_status: matchStatus,
          confidence_score: bestScore,
          matched_on: bestMatchedOn,
          reviewed: false,
        });

        const previousTotal =
          contactTotals.get(bestContact.id) || Number(bestContact.fec_total_given || 0);
        const nextTotal = previousTotal + Number(fecRecord.donation_amount || 0);
        contactTotals.set(bestContact.id, nextTotal);

        const currentLastGift = contactLastGift.get(bestContact.id);
        if (
          !currentLastGift ||
          new Date(fecRecord.donation_date).getTime() >
            new Date(currentLastGift).getTime()
        ) {
          contactLastGift.set(bestContact.id, fecRecord.donation_date);
        }

        const previousScore = contactBestScore.get(bestContact.id) || 0;
        if (bestScore > previousScore) {
          contactBestScore.set(bestContact.id, bestScore);
          contactBestStatus.set(bestContact.id, matchStatus);
        }
      }

      if (matchInserts.length > 0) {
        const { error: matchError } = await supabase
          .from("fec_contact_matches")
          .upsert(matchInserts, { onConflict: "contact_id,fec_record_id" });

        if (matchError) {
          return NextResponse.json(
            { error: matchError.message },
            { status: 500 }
          );
        }
      }

      for (const [contactId, totalGiven] of contactTotals.entries()) {
        const lastGift = contactLastGift.get(contactId) || null;
        const donorTier = calculateDonorTier(totalGiven);
        const jackpotCandidate = totalGiven >= 2500;
        const jackpotType = jackpotCandidate ? "high_value_unworked" : "none";

        const { error: updateError } = await supabase
          .from("contacts")
          .update({
            fec_match_status: contactBestStatus.get(contactId) || "probable",
            fec_confidence_score: contactBestScore.get(contactId) || null,
            fec_total_given: totalGiven,
            fec_last_donation_date: lastGift,
            fec_recent_activity: Boolean(lastGift),
            fec_donor_tier: donorTier,
            jackpot_candidate: jackpotCandidate,
            jackpot_anomaly_type: jackpotType,
            jackpot_reason: jackpotCandidate
              ? "High giving capacity is visible and should be reviewed for outreach priority."
              : null,
          })
          .eq("id", contactId)
          .eq("organization_id", organizationId);

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        source: "fec",
        count: insertedFecRecords?.length || 0,
        matchedCount: matchInserts.length,
        updatedContacts: contactTotals.size,
        listsCreated: 0,
        listSummary: [],
      });
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided for import." },
        { status: 400 }
      );
    }

    const savedContacts = await upsertContactsSafely(
      supabase,
      contacts,
      organizationId
    );

    const lists = await getOrCreateSuggestedLists(
      supabase,
      suggestedLists,
      organizationId
    );

    const summaryCounts: Record<string, number> = {};

    if (lists.length > 0 && savedContacts.length > 0) {
      const assignments: { contact_id: string; list_id: string }[] = [];
      const seenAssignments = new Set<string>();

      const listByName = new Map(lists.map((list) => [String(list.name), list]));

      const assign = (contactId: string, listName: string) => {
        const list = listByName.get(listName);
        if (!list?.id) return;

        const key = `${contactId}:${list.id}`;
        if (seenAssignments.has(key)) return;

        seenAssignments.add(key);
        assignments.push({ contact_id: contactId, list_id: list.id });
        summaryCounts[listName] = (summaryCounts[listName] || 0) + 1;
      };

      for (const contact of savedContacts) {
        if (contact.organization_id !== organizationId) continue;

        const total = donationTotal(contact);

        const generalListName =
          source === "finance" ? "General Finance Follow-Up" : "General Outreach Pool";

        assign(contact.id, generalListName);

        if (isBlank(contact.phone)) assign(contact.id, "Missing Phone Numbers");
        if (isBlank(contact.email)) assign(contact.id, "Missing Email Addresses");
        if (total >= 250) assign(contact.id, "Priority Outreach Targets");
        if (total >= 250) assign(contact.id, "High Value Donors");
        if (total > 0) assign(contact.id, "Likely Donors");
      }

      if (assignments.length > 0) {
        const { error: joinError } = await supabase
          .from("list_contacts")
          .upsert(assignments, { onConflict: "contact_id,list_id" });

        if (joinError) {
          return NextResponse.json(
            { error: joinError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: savedContacts.length,
      listsCreated: lists.length,
      listSummary: Object.entries(summaryCounts).map(([name, count]) => ({
        name,
        count,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 }
    );
  }
}
