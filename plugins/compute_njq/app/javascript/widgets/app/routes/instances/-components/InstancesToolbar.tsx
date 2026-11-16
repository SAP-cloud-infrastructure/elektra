import { Link } from "@tanstack/react-router"
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
        <Link to="/instances/new" className="btn btn-primary">
          Create New
        </Link>
      </div>
    </div>
  )
}
