export type ParsedCSV = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCSV(text: string): ParsedCSV {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  const headers = lines[0].split(",").map((h) => h.trim());

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};

    headers.forEach((header, i) => {
      row[header] = values[i]?.trim() || "";
    });

    return row;
  });

  return { headers, rows };
}