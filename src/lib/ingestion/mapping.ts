export type FieldMap = Record<string, string>;

const DEFAULT_MAP: Record<string, string> = {
  name: "full_name",
  full_name: "full_name",
  first_name: "first_name",
  last_name: "last_name",
  phone: "phone",
  phone_number: "phone",
  email: "email",
  email_address: "email",
  amount: "donation_total",
  donation: "donation_total",
};

export function autoMapFields(headers: string[]): FieldMap {
  const map: FieldMap = {};

  headers.forEach((header) => {
    const key = header.toLowerCase();

    if (DEFAULT_MAP[key]) {
      map[header] = DEFAULT_MAP[key];
    } else {
      map[header] = "";
    }
  });

  return map;
}