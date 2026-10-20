const sessionDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** e.g. "Oct 20, 3:45 PM". */
export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : sessionDateFormat.format(date);
}
