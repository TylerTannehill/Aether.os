export function transformToContacts(rows: any[], fieldMap: Record<string, string>) {
  return rows.map((row) => {
    const contact: any = {};

    Object.keys(fieldMap).forEach((csvField) => {
      const systemField = fieldMap[csvField];
      if (!systemField) return;

      contact[systemField] = row[csvField];
    });

    return contact;
  });
}

export function transformToFecRecords(
  rows: any[],
  fieldMap: Record<string, string>
) {
  return rows.map((row) => {
    const record: any = {};

    Object.keys(fieldMap).forEach((csvField) => {
      const systemField = fieldMap[csvField];
      if (!systemField) return;

      record[systemField] = row[csvField];
    });

    const amount = Number(
      record.donation_total ??
      record.contribution_amount ??
      record.amount ??
      0
    );

    return {
      contributor_name:
        record.contributor_name ||
        [record.contributor_first_name, record.contributor_last_name]
          .filter(Boolean)
          .join(" ")
          .trim(),

      contributor_first_name:
        record.contributor_first_name || null,

      contributor_last_name:
        record.contributor_last_name || null,

      street: record.street || null,
      city: record.city || null,
      state: record.state || null,
      zip: record.zip || null,

      employer: record.employer || null,
      occupation: record.occupation || null,

      donation_amount: Number.isNaN(amount) ? 0 : amount,

      donation_date:
        record.donation_date ||
        new Date().toISOString().slice(0,10),

      committee_name:
        record.committee_name || null,

      committee_cycle:
        record.committee_cycle || null,

      raw_payload: row,
    };
  });
}
