import { supabase } from "@/lib/supabase";
import {
  CampaignList,
  Contact,
  CreateListInput,
  ListContactRow,
  ListCounts,
  ListDetailData,
  UpdateListDefaultOwnerInput,
} from "./types";
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

export async function getLists(): Promise<CampaignList[]> {
  const organizationId = await getActiveOrganizationId();

  const { data, error } = await supabase
    .from("lists")
    .select("id, name, created_at, default_owner_name")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as CampaignList[]) ?? [];
}

export async function createList(input: CreateListInput) {
  const organizationId = await getActiveOrganizationId();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Please enter a list name.");
  }

  const { error } = await supabase.from("lists").insert([
    {
      name: trimmedName,
      organization_id: organizationId,
    },
  ]);

  if (error) throw error;
}

export async function updateListDefaultOwner(input: UpdateListDefaultOwnerInput) {
  const organizationId = await getActiveOrganizationId();

  const { error } = await supabase
    .from("lists")
    .update({
      default_owner_name: input.default_owner_name?.trim() || null,
    })
    .eq("id", input.listId)
    .eq("organization_id", organizationId);

  if (error) throw error;
}

export function filterLists(lists: CampaignList[], search: string) {
  const query = search.toLowerCase().trim();

  if (!query) return lists;

  return lists.filter((list) => {
    const name = list.name.toLowerCase();
    const owner = (list.default_owner_name || "").toLowerCase();

    return name.includes(query) || owner.includes(query);
  });
}

export function getListCounts(
  lists: CampaignList[],
  filteredLists: CampaignList[]
): ListCounts {
  return {
    total: lists.length,
    filtered: filteredLists.length,
    ready: lists.length,
  };
}

export async function getListDetail(listId: string): Promise<ListDetailData> {
  const organizationId = await getActiveOrganizationId();

  const { data: listData, error: listError } = await supabase
    .from("lists")
    .select("id, name, created_at, default_owner_name")
    .eq("id", listId)
    .eq("organization_id", organizationId)
    .single();

  if (listError) throw listError;

  const { data: membershipData, error: membershipError } = await supabase
    .from("list_contacts")
    .select(
      "contact_id, contacts(id, first_name, last_name, email, phone, city, state, party, organization_id)"
    )
    .eq("list_id", listId);

  const { data: contactsData, error: contactsError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, city, state, party")
    .eq("organization_id", organizationId)
    .order("last_name", { ascending: true });

  if (membershipError) throw membershipError;
  if (contactsError) throw contactsError;

  const assignedContacts =
    ((membershipData ?? []) as unknown as ListContactRow[]).flatMap((row) => {
      const linked = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
      return linked && (linked as any).organization_id === organizationId
        ? [linked]
        : [];
    });

  return {
    list: (listData as CampaignList) ?? null,
    assignedContacts,
    allContacts: (contactsData as Contact[]) ?? [],
  };
}

export async function addContactToList(listId: string, contactId: string) {
  const organizationId = await getActiveOrganizationId();

  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("organization_id", organizationId)
    .single();

  if (listError) throw listError;
  if (!list) throw new Error("List not found in active campaign.");

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("organization_id", organizationId)
    .single();

  if (contactError) throw contactError;
  if (!contact) throw new Error("Contact not found in active campaign.");

  const { error } = await supabase.from("list_contacts").insert([
    {
      list_id: listId,
      contact_id: contactId,
    },
  ]);

  if (error) throw error;
}

export async function removeContactFromList(listId: string, contactId: string) {
  const organizationId = await getActiveOrganizationId();

  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("organization_id", organizationId)
    .single();

  if (listError) throw listError;
  if (!list) throw new Error("List not found in active campaign.");

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("organization_id", organizationId)
    .single();

  if (contactError) throw contactError;
  if (!contact) throw new Error("Contact not found in active campaign.");

  const { error } = await supabase
    .from("list_contacts")
    .delete()
    .eq("list_id", listId)
    .eq("contact_id", contactId);

  if (error) throw error;
}

export function getAvailableContacts(
  allContacts: Contact[],
  assignedContacts: Contact[]
) {
  return allContacts.filter(
    (contact) => !assignedContacts.some((assigned) => assigned.id === contact.id)
  );
}

export function filterAssignedContacts(assignedContacts: Contact[], search: string) {
  const query = search.toLowerCase().trim();

  if (!query) return assignedContacts;

  return assignedContacts.filter((contact) => {
    const name = fullName(contact).toLowerCase();
    const email = (contact.email || "").toLowerCase();
    const phone = (contact.phone || "").toLowerCase();

    return (
      name.includes(query) || email.includes(query) || phone.includes(query)
    );
  });
}
