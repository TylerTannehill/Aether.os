export type FieldMap = Record<string, string>;

const DEFAULT_MAP: Record<string, string> = {
  // contact mappings
  name: "full_name",
  full_name: "full_name",
  first_name: "first_name",
  last_name: "last_name",
  phone: "phone",
  phone_number: "phone",
  mobile: "phone",
  cell: "phone",
  email: "email",
  email_address: "email",

  // finance generic mappings
  amount: "donation_total",
  donation: "donation_total",
  contribution: "donation_total",
  contribution_amount: "donation_total",

  // Phase 5 FEC mappings
  contributor_name: "contributor_name",
  contributor_first_name: "contributor_first_name",
  contributor_last_name: "contributor_last_name",
  employer: "employer",
  occupation: "occupation",
  street: "street",
  address: "street",
  city: "city",
  state: "state",
  zip: "zip",
  zipcode: "zip",
  donation_date: "donation_date",
  contribution_date: "donation_date",
  committee_name: "committee_name",
  committee_cycle: "committee_cycle",
};

export function autoMapFields(headers: string[]): FieldMap {
  const map: FieldMap = {};

  headers.forEach((header) => {
    const key = header.toLowerCase().trim();

    if (DEFAULT_MAP[key]) {
      map[header] = DEFAULT_MAP[key];
    } else {
      map[header] = "";
    }
  });

  return map;
}
