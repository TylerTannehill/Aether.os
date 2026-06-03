import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CreateContributionBody = {
  contactId?: string;
  amount?: number | string;
  source?: string;
  date?: string;
};

function normalizeSource(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "check") return "check";
  if (normalized === "cash") return "cash";
  if (normalized === "online") return "online";

  return "check";
}

function normalizeDate(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = (await request.json().catch(() => null)) as
      | CreateContributionBody
      | null;

    const contactId = body?.contactId;
    const amount = Number(body?.amount ?? 0);
    const source = normalizeSource(body?.source);
    const date = normalizeDate(body?.date);

    if (!contactId) {
      return NextResponse.json(
        { error: "Missing contactId" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Contribution amount must be greater than zero" },
        { status: 400 },
      );
    }

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, organization_id, donation_total")
      .eq("id", contactId)
      .maybeSingle();

    if (contactError) {
      return NextResponse.json(
        { error: `Contact lookup failed: ${contactError.message}` },
        { status: 500 },
      );
    }

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contributionPayload = {
      contact_id: contactId,
      amount,
      source,
      date,
      organization_id: contact.organization_id ?? null,
    };

    const { data: contribution, error: contributionError } = await supabase
      .from("contributions")
      .insert([contributionPayload])
      .select("id, contact_id, amount, source, date, organization_id, created_at")
      .single();

    if (contributionError) {
      return NextResponse.json(
        { error: `Contribution insert failed: ${contributionError.message}` },
        { status: 500 },
      );
    }

    const currentDonationTotal = Number(contact.donation_total || 0);
    const nextDonationTotal = currentDonationTotal + amount;

    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        donation_total: nextDonationTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      return NextResponse.json(
        {
          error: `Contribution saved, but contact total failed to update: ${updateError.message}`,
          contribution,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      contribution,
      contact: {
        id: contactId,
        donation_total: nextDonationTotal,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save contribution" },
      { status: 500 },
    );
  }
}
