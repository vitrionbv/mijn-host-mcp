export function appendQueryParams(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return path;
  }

  return path.includes("?") ? `${path}&${queryString}` : `${path}?${queryString}`;
}

export function compactQuery(
  query: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean | undefined> {
  const result: Record<string, string | number | boolean | undefined> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}
