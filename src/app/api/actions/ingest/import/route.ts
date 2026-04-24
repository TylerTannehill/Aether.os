import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function donationTotal(contact: Record<string, any>) {
  const value = Number(contact.donation_total ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
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

function calculateDonorTier(totalGiven: number) {
  if (totalGiven >= 6600) return "maxed";
  if (totalGiven >= 2500) return "major";
  if (totalGiven >= 500) return "mid";
  if (totalGiven > 0) return "base";
  return "none";
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts = body.contacts ?? [];
    const fecRecords = body.fecRecords ?? body.records ?? [];
    const suggestedLists: string[] = body.suggestedLists ?? [];
    const source: string = body.source ?? "outreach";

    const supabase = await createClient();

    if (source === "fec") {
      if (!Array.isArray(fecRecords) || fecRecords.length === 0) {
        return NextResponse.json(
          { error: "No FEC records provided for import." },
          { status: 400 }
        );
      }

      const sanitizedRecords = fecRecords
        .map((record: Record<string, any>) => ({
          source_file_id: record.source_file_id || null,
          source_record_id: record.source_record_id || null,
          import_batch_id: record.import_batch_id || `fec-${Date.now()}`,
          contributor_name: String(record.contributor_name || "").trim(),
          contributor_first_name: record.contributor_first_name || null,
          contributor_last_name: record.contributor_last_name || null,
          street: record.street || null,
          city: record.city || null,
          state: record.state || null,
          zip: record.zip || null,
          employer: record.employer || null,
          occupation: record.occupation || null,
          donation_amount: Number(record.donation_amount || 0),
          donation_date:
            record.donation_date || new Date().toISOString().slice(0, 10),
          committee_name: record.committee_name || null,
          committee_cycle: record.committee_cycle || null,
          raw_payload: record.raw_payload || record,
        }))
        .filter((record: Record<string, any>) => record.contributor_name);

      const { data: insertedFecRecords, error: fecError } = await supabase
        .from("fec_raw_records")
        .insert(sanitizedRecords)
        .select();

      if (fecError) {
        return NextResponse.json(
          { error: fecError.message },
          { status: 500 }
        );
      }

      const { data: existingContacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, city, state, fec_total_given");

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
          contact_id: bestContact.id,
          fec_record_id: fecRecord.id,
          match_status: matchStatus,
          confidence_score: bestScore,
          matched_on: bestMatchedOn,
          reviewed: false,
        });

        const previousTotal = contactTotals.get(bestContact.id) || Number(bestContact.fec_total_given || 0);
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
        const jackpotType = jackpotCandidate
          ? "high_value_unworked"
          : "none";

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
          .eq("id", contactId);

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
