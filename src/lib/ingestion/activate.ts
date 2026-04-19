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