// Small inline loading indicator used while the full instance detail is still
// loading and the modal shows placeholder data derived from the list row.
// Uses Elektra's default `.spinner` (monsoon theme), matching the legacy
// server-rendered pages, not Bootstrap's spinner-border.
export function InlineLoading() {
  return <span className="spinner" role="status" aria-hidden="true" />
}
