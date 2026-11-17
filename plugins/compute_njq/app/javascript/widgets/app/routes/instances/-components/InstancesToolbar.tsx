import { Link } from "@tanstack/react-router"
import { policy } from "lib/policy"
import { SearchField } from "lib/components/search_field"
import { humanize } from "./tabs/humanize"

interface InstancesToolbarProps {
  searchTerm: string
  onSearch: (term: string) => void
  // Number of instances currently visible (after filtering), for the count label.
  visibleCount: number
  // Facet filters.
  statusOptions: string[]
  azOptions: string[]
  status: string
  az: string
  onStatusChange: (value: string) => void
  onAzChange: (value: string) => void
  // Policy scope (domain/project target). Threaded from the layout route like
  // InstanceTable; currently {} until targeted scoping lands.
  scope: Record<string, unknown>
}

// Defense-in-depth: the client hides the Create button when the user may not
// create (so the UI never pretends an action is available), while the BFF
// enforces the same compute_njq:instance_create rule server-side (a hand-crafted
// request still gets a 403). An unevaluable rule — missing from the policy
// config (stale server, typo) — makes policy.isAllowed throw; treat that as
// "not allowed" (fail-closed) so the button hides instead of the throw crashing
// the list through the router error boundary. Mirrors instanceActions.ts.
function canCreate(scope: Record<string, unknown>): boolean {
  try {
    return policy.isAllowed("compute_njq:instance_create", { target: scope })
  } catch {
    return false
  }
}

// Toolbar above the instance list: free-text search, quick facet filters
// (status, AZ) and a "Create New" button that opens the create-instance modal
// at /instances/new. Mirrors the legacy compute toolbar layout (search left,
// main action right).
export function InstancesToolbar({
  searchTerm,
  onSearch,
  visibleCount,
  statusOptions,
  azOptions,
  status,
  az,
  onStatusChange,
  onAzChange,
  scope,
}: InstancesToolbarProps) {
  return (
    <div className="toolbar">
      <SearchField
        onChange={onSearch}
        value={searchTerm}
        placeholder="Name, ID, IP, status, OS or size"
        text="Searches the loaded servers by name, ID, IP, status, OS image or flavor."
      />
      <span className="toolbar-input-divider" />
      <select
        className="form-select w-auto"
        aria-label="Filter by status"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">All statuses</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {humanize(s)}
          </option>
        ))}
      </select>
      <select
        className="form-select w-auto ms-2"
        aria-label="Filter by availability zone"
        value={az}
        onChange={(e) => onAzChange(e.target.value)}
      >
        <option value="">All availability zones</option>
        {azOptions.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>
      <span className="toolbar-input-divider" />
      {visibleCount} {visibleCount === 1 ? "server" : "servers"}
      <div className="main-buttons">
        {canCreate(scope) && (
          <Link to="/instances/new" className="btn btn-primary">
            Create New
          </Link>
        )}
      </div>
    </div>
  )
}
