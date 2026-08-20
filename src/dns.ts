/** Append a trailing dot so live DNS names match mijn.host FQDN examples. */
export function ensureTrailingDot(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed === '@') {
    return trimmed;
  }
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

export function normalizeLiveDnsRecord<T extends { name: string }>(record: T): T {
  return { ...record, name: ensureTrailingDot(record.name) };
}
