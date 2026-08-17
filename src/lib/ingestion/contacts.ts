import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared server-side contact ingestion helper.
 *
 * This is intentionally independent of browser/session state so integrations
 * such as WinRed and ActBlue can safely ingest contacts when they already know
 * the destination organization_id.
 */

export type IncomingContact = Record<string, unknown>;

export type ContactIngestionResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

type ExistingContact = Record<string, any>;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned ? cleaned : null;
}

function email(value: unknown): string | null {
  return text(value)?.toLowerCase() ?? null;
}

function phone(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Normalize US numbers with a leading country code.
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
}

function state(value: unknown): string | null {
  return text(value)?.toUpperCase() ?? null;
}

function zip(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const match = raw.match(/\d{5}/);
  return match?.[0] ?? raw;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstPresent(
  source: IncomingContact,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

export function normalizeContact(
  input: IncomingContact,
  organizationId: string,
): Record<string, any> {
  const firstName = text(
    firstPresent(input, ["first_name", "firstName", "firstname"]),
  );
  const lastName = text(
    firstPresent(input, ["last_name", "lastName", "lastname"]),
  );

  return {
    organization_id: organizationId,
    first_name: firstName,
    last_name: lastName,
    email: email(firstPresent(input, ["email", "email_address", "emailAddress"])),
    phone: phone(
      firstPresent(input, ["phone", "phone_number", "phoneNumber", "mobile"]),
    ),
    address: text(
      firstPresent(input, [
        "address",
        "address1",
        "address_1",
        "street",
        "street_address",
      ]),
    ),
    city: text(firstPresent(input, ["city"])),
    state: state(firstPresent(input, ["state", "state_code", "stateCode"])),
    zip: zip(firstPresent(input, ["zip", "zipcode", "zip_code", "postal_code"])),
    notes: text(firstPresent(input, ["notes", "note"])),
    donation_total: numberValue(
      firstPresent(input, [
        "donation_total",
        "donation_amount",
        "amount",
        "contribution",
        "contribution_amount",
        "contributionAmount",
      ]),
    ),
  };
}

function normalizeName(value: unknown): string {
  return text(value)?.toLowerCase().replace(/\s+/g, " ") ?? "";
}

function contactKeyCandidates(contact: Record<string, any>): string[] {
  const keys: string[] = [];

  const normalizedEmail = email(contact.email);
  const normalizedPhone = phone(contact.phone);
  const first = normalizeName(contact.first_name);
  const last = normalizeName(contact.last_name);
  const normalizedZip = zip(contact.zip);
  const normalizedCity = normalizeName(contact.city);
  const normalizedState = state(contact.state);

  if (normalizedEmail) keys.push(`email:${normalizedEmail}`);
  if (normalizedPhone) keys.push(`phone:${normalizedPhone}`);

  if (first && last && normalizedZip) {
    keys.push(`namezip:${first}|${last}|${normalizedZip}`);
  }

  if (first && last && normalizedCity && normalizedState) {
    keys.push(`namecitystate:${first}|${last}|${normalizedCity}|${normalizedState}`);
  }

  if (first && last) {
    keys.push(`name:${first}|${last}`);
  }

  return keys;
}

function buildContactIndex(existing: ExistingContact[]) {
  const index = new Map<string, ExistingContact>();

  for (const contact of existing) {
    for (const key of contactKeyCandidates(contact)) {
      if (!index.has(key)) index.set(key, contact);
    }
  }

  return index;
}

function findExisting(
  incoming: Record<string, any>,
  index: Map<string, ExistingContact>,
): ExistingContact | null {
  for (const key of contactKeyCandidates(incoming)) {
    const match = index.get(key);
    if (match) return match;
  }
  return null;
}

function mergeContact(
  existing: ExistingContact,
  incoming: Record<string, any>,
): Record<string, any> {
  const merged: Record<string, any> = { ...existing };

  // Incoming non-empty values may enrich the existing contact, but blank
  // integration values never erase useful data already in Aether.
  for (const [key, value] of Object.entries(incoming)) {
    if (
      key === "id" ||
      key === "created_at" ||
      key === "updated_at" ||
      key === "organization_id"
    ) {
      continue;
    }

    if (key === "donation_total") {
      const existingTotal = numberValue(existing[key]) ?? 0;
      const incomingTotal = numberValue(value) ?? 0;
      merged[key] = Math.max(existingTotal, incomingTotal);
      continue;
    }

    if (value !== null && value !== undefined && value !== "") {
      merged[key] = value;
    }
  }

  return merged;
}

function cleanForWrite(contact: Record<string, any>) {
  const copy = { ...contact };

  // Never attempt to write fields that are undefined.
  for (const key of Object.keys(copy)) {
    if (copy[key] === undefined) delete copy[key];
  }

  return copy;
}

/**
 * Ingest one or more contacts into the existing `contacts` table.
 *
 * Matching order mirrors Aether's established ingestion behavior:
 * email -> phone -> name+ZIP -> name+city/state -> name.
 *
 * Nothing here writes to Finance. Finance and other Aether surfaces continue
 * reading from Contacts through their existing paths.
 */
export async function ingestContactsForOrganization(
  supabase: SupabaseClient,
  organizationId: string,
  incomingContacts: IncomingContact[],
): Promise<ContactIngestionResult> {
  if (!organizationId) {
    throw new Error("organizationId is required for contact ingestion.");
  }

  const result: ContactIngestionResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (!incomingContacts.length) return result;

  const { data: existingContacts, error: loadError } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId);

  if (loadError) {
    throw new Error(`Unable to load existing contacts: ${loadError.message}`);
  }

  const existing = (existingContacts ?? []) as ExistingContact[];
  const index = buildContactIndex(existing);

  for (const raw of incomingContacts) {
    const incoming = normalizeContact(raw, organizationId);

    // A contact must have enough identity to be useful/matchable.
    if (
      !incoming.email &&
      !incoming.phone &&
      !(incoming.first_name && incoming.last_name)
    ) {
      result.skipped += 1;
      continue;
    }

    const match = findExisting(incoming, index);

    if (match) {
      const merged = cleanForWrite(mergeContact(match, incoming));
      const id = match.id;

      if (!id) {
        result.skipped += 1;
        result.errors.push("Matched an existing contact without an id.");
        continue;
      }

      delete merged.id;
      delete merged.created_at;
      delete merged.updated_at;

      const { data: updated, error: updateError } = await supabase
        .from("contacts")
        .update(merged)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select("*")
        .single();

      if (updateError) {
        result.errors.push(`Contact update failed: ${updateError.message}`);
        continue;
      }

      result.updated += 1;

      if (updated) {
        for (const key of contactKeyCandidates(updated)) index.set(key, updated);
      }
      continue;
    }

    const insertPayload = cleanForWrite(incoming);

    const { data: created, error: insertError } = await supabase
      .from("contacts")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError) {
      result.errors.push(`Contact insert failed: ${insertError.message}`);
      continue;
    }

    result.created += 1;

    if (created) {
      for (const key of contactKeyCandidates(created)) index.set(key, created);
    }
  }

  return result;
}
