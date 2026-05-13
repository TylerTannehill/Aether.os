import { supabase } from "@/lib/supabase";
import { Contact, ContactCounts } from "./types";
import { fullName } from "./utils";

async function getActiveOrganizationId() {
  const response = await fetch("/api/auth/current-context", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to resolve active campaign context.");
  }

  const payload = await response.json();

  const organizationId =
    payload?.organization?.id ||
    payload?.membership?.organization_id ||
    null;

  if (!organizationId) {
    throw new Error("No active campaign selected.");
  }

  return organizationId;
}

export async function getContacts(): Promise<Contact[]> {
  const organizationId = await getActiveOrganizationId();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("last_name", { ascending: true });

  if (error) throw error;

  return (data as Contact[]) ?? [];
}

export async function updateContactOwner(
  contactId: string,
  ownerName?: string | null
) {
  const organizationId = await getActiveOrganizationId();

  const { error } = await supabase
    .from("contacts")
    .update({
      owner_name: ownerName?.trim() || null,
    })
    .eq("id", contactId)
    .eq("organization_id", organizationId);

  if (error) throw error;
}

export async function bulkUpdateContactOwner(
  contactIds: string[],
  ownerName?: string | null
) {
  if (contactIds.length === 0) {
    throw new Error("Please select at least one contact.");
  }

  const organizationId = await getActiveOrganizationId();

  const { error } = await supabase
    .from("contacts")
    .update({
      owner_name: ownerName?.trim() || null,
    })
    .in("id", contactIds)
    .eq("organization_id", organizationId);

  if (error) throw error;
}

export function filterContacts(
  contacts: Contact[],
  search: string,
  cityFilter: string,
  stateFilter: string,
  partyFilter: string
) {
  const searchValue = search.toLowerCase().trim();
  const cityValue = cityFilter.toLowerCase().trim();
  const stateValue = stateFilter.toLowerCase().trim();
  const partyValue = partyFilter.toLowerCase().trim();

  return contacts.filter((contact) => {
    const name = fullName(contact).toLowerCase();
    const email = (contact.email || "").toLowerCase();
    const city = (contact.city || "").toLowerCase();
    const state = (contact.state || "").toLowerCase();
    const party = (contact.party || "").toLowerCase();
    const owner = (contact.owner_name || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      owner.includes(searchValue);

    const matchesCity = !cityValue || city.includes(cityValue);
    const matchesState = !stateValue || state.includes(stateValue);
    const matchesParty = !partyValue || party.includes(partyValue);

    return matchesSearch && matchesCity && matchesState && matchesParty;
  });
}

export function getContactCounts(
  contacts: Contact[],
  filteredContacts: Contact[]
): ContactCounts {
  return {
    total: contacts.length,
    filtered: filteredContacts.length,
    withPhone: contacts.filter((contact) => !!contact.phone).length,
    withEmail: contacts.filter((contact) => !!contact.email).length,
  };
}
