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

export async function getLists(): Promise<CampaignList[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, created_at, default_owner_name")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as CampaignList[]) ?? [];
}

export async function createList(input: CreateListInput) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Please enter a list name.");
  }

  const { error } = await supabase.from("lists").insert([
    {
      name: trimmedName,
    },
  ]);

  if (error) throw error;
}

export async function updateListDefaultOwner(input: UpdateListDefaultOwnerInput) {
  const { error } = await supabase
    .from("lists")
    .update({
      default_owner_name: input.default_owner_name?.trim() || null,
    })
    .eq("id", input.listId);

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
  const { data: listData, error: listError } = await supabase
    .from("lists")
    .select("id, name, created_at, default_owner_name")
    .eq("id", listId)
    .single();

  const { data: membershipData, error: membershipError } = await supabase
    .from("list_contacts")
    .select(
      "contact_id, contacts(id, first_name, last_name, email, phone, city, state, party)"
    )
    .eq("list_id", listId);

  const { data: contactsData, error: contactsError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, city, state, party")
    .order("last_name", { ascending: true });

  if (listError) throw listError;
  if (membershipError) throw membershipError;
  if (contactsError) throw contactsError;

  const assignedContacts =
    (membershipData as ListContactRow[] | null)?.flatMap((row) =>
      row.contacts ? [row.contacts] : []
    ) ?? [];

  return {
    list: (listData as CampaignList) ?? null,
    assignedContacts,
    allContacts: (contactsData as Contact[]) ?? [],
  };
}

export async function addContactToList(listId: string, contactId: string) {
  const { error } = await supabase.from("list_contacts").insert([
    {
      list_id: listId,
      contact_id: contactId,
    },
  ]);

  if (error) throw error;
}

export async function removeContactFromList(listId: string, contactId: string) {
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