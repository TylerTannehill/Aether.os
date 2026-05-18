import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  return state.length === 2 ? state.toUpperCase() : state;
}

function buildContactSearchKey(contact: Record<string, any>) {
  const email = normalizeEmail(contact.email);
  if (email) return `email:${email}`;

  const phone = normalizePhone(contact.phone);
  if (phone) return `phone:${phone}`;

  const first = normalizeText(contact.first_name);
  const last = normalizeText(contact.last_name);

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

    if (email) index.set(`email:${email}`, contact);
    if (phone) index.set(`phone:${phone}`, contact);
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

    if (key === "fec_total_given") {
      const existingTotal = Number(existingValue || 0);
      const incomingTotal = Number(value || 0);

      merged[key] =
        (Number.isNaN(existingTotal) ? 0 : existingTotal) +
        (Number.isNaN(incomingTotal) ? 0 : incomingTotal);

      return;
    }

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      merged[key] = value;
    } else if (
      existingValue !== null &&
      existingValue !== undefined &&
      String(existingValue).trim() !== ""
    ) {
      merged[key] = existingValue;
    }
  });

  return merged;
}

async function getActiveOrganizationId(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated.");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  const activeOrganizationId =
    cookieStore.get("active_organization_id")?.value;

  if (!activeOrganizationId) {
    throw new Error("No active campaign selected.");
  }

  return activeOrganizationId;
}

async function getOrCreateLists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  listNames: string[]
) {
  const uniqueNames = Array.from(new Set(listNames));

  const { data: existingLists, error: existingError } = await supabase
    .from("lists")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("name", uniqueNames);

  if (existingError) throw existingError;

  const existingByName = new Map(
    ((existingLists as Record<string, any>[]) || []).map((list) => [
      String(list.name),
      list,
    ])
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

export async function POST() {
  try {
    const supabase = await createClient();

    const organizationId = await getActiveOrganizationId(supabase);

    const actBlueContacts = [
      {
        first_name: "Maya",
        last_name: "Henderson",
        email: "maya.henderson@example.com",
        phone: "3125550142",
        address: "1440 W Monroe St",
        city: "Chicago",
        state: "IL",
        occupation: "Teacher",
        employer: "Chicago Public Schools",
        fec_total_given: 500,
        fec_recent_activity: true,
        fec_donor_tier: "mid",
        owner_name: "Finance Director",
      },
      {
        first_name: "Robert",
        last_name: "Kim",
        email: "robert.kim@example.com",
        phone: "3125550198",
        address: "822 N Damen Ave",
        city: "Chicago",
        state: "IL",
        occupation: "Attorney",
        employer: "Kim Legal Group",
        fec_total_given: 2800,
        fec_recent_activity: true,
        fec_donor_tier: "major",
        owner_name: "Finance Director",
        jackpot_candidate: true,
        jackpot_anomaly_type: "high_value_online_donor",
        jackpot_reason:
          "High-value ActBlue donor should be reviewed for finance follow-up.",
      },
    ];

    const normalizedContacts = actBlueContacts.map((contact) => ({
      organization_id: organizationId,
      first_name: cleanString(contact.first_name),
      last_name: cleanString(contact.last_name),
      email: normalizeEmail(contact.email),
      phone: normalizePhone(contact.phone),
      address: cleanString(contact.address),
      city: cleanString(contact.city),
      state: normalizeState(contact.state),
      occupation: cleanString(contact.occupation),
      employer: cleanString(contact.employer),
      owner_name: cleanString(contact.owner_name),
      fec_total_given: Number(contact.fec_total_given || 0),
      fec_recent_activity: Boolean(contact.fec_recent_activity),
      fec_donor_tier: cleanString(contact.fec_donor_tier),
      jackpot_candidate: Boolean(contact.jackpot_candidate),
      jackpot_anomaly_type: cleanString(contact.jackpot_anomaly_type),
      jackpot_reason: cleanString(contact.jackpot_reason),
    }));

    const { data: existingContacts, error: existingError } = await supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", organizationId);

    if (existingError) throw existingError;

    const index = buildExistingContactIndex(
      (existingContacts as Record<string, any>[]) || []
    );

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
        if (updated) savedContacts.push(updated);

        continue;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("contacts")
        .insert([contact])
        .select()
        .single();

      if (insertError) throw insertError;
      if (inserted) savedContacts.push(inserted);
    }

    const lists = await getOrCreateLists(supabase, organizationId, [
      "Likely Donors",
      "High Value Donors",
      "General Finance Follow-Up",
    ]);

    const listByName = new Map(lists.map((list) => [String(list.name), list]));
    const assignments: { contact_id: string; list_id: string }[] = [];

    const assign = (contactId: string, listName: string) => {
      const list = listByName.get(listName);
      if (!list?.id) return;

      assignments.push({
        contact_id: contactId,
        list_id: list.id,
      });
    };

    savedContacts.forEach((contact) => {
      assign(contact.id, "General Finance Follow-Up");

      if (Number(contact.fec_total_given || 0) > 0) {
        assign(contact.id, "Likely Donors");
      }

      if (Number(contact.fec_total_given || 0) >= 250) {
        assign(contact.id, "High Value Donors");
      }
    });

    if (assignments.length > 0) {
      const { error: assignmentError } = await supabase
        .from("list_contacts")
        .upsert(assignments, {
          onConflict: "contact_id,list_id",
        });

      if (assignmentError) throw assignmentError;
    }

    return NextResponse.json({
      success: true,
      source: "actblue",
      imported: savedContacts.length,
      contacts: savedContacts.length,
      listsCreated: lists.length,
      listAssignments: assignments.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        source: "actblue",
        error: error?.message || "ActBlue sync failed.",
      },
      { status: 500 }
    );
  }
}