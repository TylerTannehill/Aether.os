import { supabase } from "@/lib/supabase";
import { Contact, ContactCounts } from "./types";
import { fullName } from "./utils";

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) throw error;

  return (data as Contact[]) ?? [];
}

export async function updateContactOwner(contactId: string, ownerName?: string | null) {
  const { error } = await supabase
    .from("contacts")
    .update({
      owner_name: ownerName?.trim() || null,
    })
    .eq("id", contactId);

  if (error) throw error;
}

export async function bulkUpdateContactOwner(
  contactIds: string[],
  ownerName?: string | null
) {
  if (contactIds.length === 0) {
    throw new Error("Please select at least one contact.");
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      owner_name: ownerName?.trim() || null,
    })
    .in("id", contactIds);

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