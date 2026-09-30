/** Current time as an ISO-8601 string — the only format written to Firestore. */
export const nowISO = () => new Date().toISOString();

/**
 * Formats a stored date for display in the Persian calendar.
 * Accepts ISO strings and `YYYY-MM-DD` input values; anything else (e.g. legacy
 * pre-formatted Persian strings) is returned unchanged.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fa-IR');
}
