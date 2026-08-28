export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matches(query: string, ...fields: string[]): boolean {
  const q = normalize(query);
  if (!q) {
    return true;
  }
  return fields.some((field) => normalize(field).includes(q));
}
