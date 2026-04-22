export function buildAuthHeaders(
  extraHeaders: Record<string, string>,
  apiKey?: string,
): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  return headers;
}
