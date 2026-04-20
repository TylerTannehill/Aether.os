import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function donationTotal(contact: Record<string, any>) {
  const value = Number(contact.donation_total ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts = body.contacts ?? [];
    const suggestedLists: string[] = body.suggestedLists ?? [];
    const source: string = body.source ?? "outreach";

    // ✅ FIX: await the client
    const supabase = await createClient();

    const { data: insertedContacts, error: contactError } = await supabase
      .from("contacts")
      .upsert(contacts, { onConflict: "phone" })
      .select();

    if (contactError) {
      return NextResponse.json(
        { error: contactError.message },
        { status: 500 }
      );
    }

    let createdLists: any[] = [];

    if (suggestedLists.length > 0) {
      const listInserts = suggestedLists.map((name) => ({
        name,
      }));

      const { data: lists, error: listError } = await supabase
        .from("lists")
        .insert(listInserts)
        .select();

      if (listError) {
        return NextResponse.json(
          { error: listError.message },
          { status: 500 }
        );
      }

      createdLists = lists || [];
    }

    const summaryCounts: Record<string, number> = {};

    if (createdLists.length > 0 && insertedContacts?.length > 0) {
      const assignments: { contact_id: string; list_id: string }[] = [];

      const listByName = new Map(
        createdLists.map((list) => [String(list.name), list])
      );

      const increment = (listName: string) => {
        summaryCounts[listName] = (summaryCounts[listName] || 0) + 1;
      };

      for (const contact of insertedContacts) {
        const total = donationTotal(contact);

        const generalListName =
          source === "finance"
            ? "General Finance Follow-Up"
            : "General Outreach Pool";

        const generalList = listByName.get(generalListName);
        if (generalList) {
          assignments.push({
            contact_id: contact.id,
            list_id: generalList.id,
          });
          increment(generalListName);
        }

        const missingPhoneList = listByName.get("Missing Phone Numbers");
        if (missingPhoneList && isBlank(contact.phone)) {
          assignments.push({
            contact_id: contact.id,
            list_id: missingPhoneList.id,
          });
          increment("Missing Phone Numbers");
        }

        const missingEmailList = listByName.get("Missing Email Addresses");
        if (missingEmailList && isBlank(contact.email)) {
          assignments.push({
            contact_id: contact.id,
            list_id: missingEmailList.id,
          });
          increment("Missing Email Addresses");
        }

        const priorityOutreachList = listByName.get("Priority Outreach Targets");
        if (priorityOutreachList && total >= 250) {
          assignments.push({
            contact_id: contact.id,
            list_id: priorityOutreachList.id,
          });
          increment("Priority Outreach Targets");
        }

        const highValueDonorsList = listByName.get("High Value Donors");
        if (highValueDonorsList && total >= 250) {
          assignments.push({
            contact_id: contact.id,
            list_id: highValueDonorsList.id,
          });
          increment("High Value Donors");
        }

        const likelyDonorsList = listByName.get("Likely Donors");
        if (likelyDonorsList && total > 0) {
          assignments.push({
            contact_id: contact.id,
            list_id: likelyDonorsList.id,
          });
          increment("Likely Donors");
        }
      }

      if (assignments.length > 0) {
        const { error: joinError } = await supabase
          .from("contact_lists")
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
      count: insertedContacts?.length || 0,
      listsCreated: createdLists.length,
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