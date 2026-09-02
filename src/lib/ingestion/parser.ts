export type ParsedCSV = {
  headers: string[];
  rows: Record<string, string>[];
};

/**
 * Parse a single CSV record according to standard CSV quoting rules.
 *
 * Handles:
 * - Commas inside quoted fields
 * - Escaped quotes ("")
 * - Empty fields
 * - Quoted/unquoted values
 */
function parseCSVRecord(record: string): string[] {
  const values: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < record.length; i += 1) {
    const char = record[i];

    if (char === '"') {
      if (inQuotes && record[i + 1] === '"') {
        // Two quotes inside a quoted field represent one literal quote.
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value.trim());

  return values;
}

/**
 * Split CSV text into logical records.
 *
 * We cannot simply split on "\n" because a properly quoted CSV field
 * is allowed to contain line breaks.
 */
function splitCSVRecords(text: string): string[] {
  const records: string[] = [];
  let record = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // Preserve the escaped pair so parseCSVRecord can decode it.
        record += '""';
        i += 1;
        continue;
      }

      inQuotes = !inQuotes;
      record += char;
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (record.trim().length > 0) {
        records.push(record);
      }

      record = "";

      // Treat Windows CRLF as one line ending.
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }

      continue;
    }

    record += char;
  }

  if (record.trim().length > 0) {
    records.push(record);
  }

  return records;
}

export function parseCSV(text: string): ParsedCSV {
  // Remove a UTF-8 BOM if the CSV was exported with one.
  const normalizedText = text.replace(/^\uFEFF/, "");

  const records = splitCSVRecords(normalizedText);

  if (records.length === 0) {
    return {
      headers: [],
      rows: [],
    };
  }

  const headers = parseCSVRecord(records[0]).map((header) =>
    header.trim()
  );

  const rows = records.slice(1).map((record) => {
    const values = parseCSVRecord(record);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });

  return {
    headers,
    rows,
  };
}