/** Shown for a moment while a page that loads on demand is downloading. */
export function PageLoading() {
  return (
    <p role="status" style={{ textAlign: 'center', paddingBlock: '2rem' }}>
      Loading…
    </p>
  );
}
