import { useState } from "react"
import { createFileRoute, useRouteContext, Outlet } from "@tanstack/react-router"
import type { Instance } from "../../types/instance"
import { useInstancesQuery } from "../../hooks/useInstanceQueries"
import { InstanceTable } from "./-components/InstanceTable"
import { InstancesToolbar } from "./-components/InstancesToolbar"
import { WebConsolePanel } from "./-components/WebConsolePanel"
import { filterInstances, facetValues } from "./-components/filterInstances"

export const Route = createFileRoute("/instances")({
  component: InstancesLayout,
})

// Layout route for the instances section: the toolbar + list render ONCE here
// and stay mounted, while child routes (the create modal at /instances/new and
// the detail modal at /instances/$id) render into the <Outlet/> on top. This
// keeps the list's scroll position and the search/filter/sort state intact when
// opening/closing a modal — no background jump.
function InstancesLayout() {
  const { apiClient, basepath } = useRouteContext({ from: Route.id })
  const { data: instances, isLoading, isError, error } = useInstancesQuery(apiClient)
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState("")
  const [az, setAz] = useState("")
  // The instance whose web console is open (null = panel closed). Lifted here
  // so the slide-up panel is mounted once, above the table, and survives row
  // re-renders.
  const [consoleInstance, setConsoleInstance] = useState<Pick<Instance, "id" | "name"> | null>(null)

  const all = instances ?? []
  const { statuses, azs } = facetValues(all)
  const filtered = filterInstances(all, { term: searchTerm, status, az })

  // Any active search text or facet selection means the (possibly empty) list is
  // the result of filtering, not of an empty project — the empty state and the
  // "Clear filters" affordance distinguish the two cases.
  const filtersActive = searchTerm !== "" || status !== "" || az !== ""
  const resetFilters = () => {
    setSearchTerm("")
    setStatus("")
    setAz("")
  }

  return (
    <div>
      {isError && (
        <div className="alert alert-danger" role="alert">
          <strong>Failed to load instances.</strong>
          {error?.message && <span className="ms-1">{error.message}</span>}
        </div>
      )}
      {/* scope is {} for now: the policy rules (create gate here, lifecycle
          actions in the table) evaluate without a target. TODO(step-2): thread
          scoped_domain_name/project for targeted policy checks. */}
      <InstancesToolbar
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        visibleCount={filtered.length}
        statusOptions={statuses}
        azOptions={azs}
        status={status}
        az={az}
        onStatusChange={setStatus}
        onAzChange={setAz}
        scope={{}}
      />
      <InstanceTable
        instances={filtered}
        isLoading={isLoading}
        apiClient={apiClient}
        scope={{}}
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onOpenConsole={setConsoleInstance}
        consoleHref={(id) => `${basepath}/instances/${id}/console`}
      />
      {/* The /instances/new and /instances/$id modals render here, over the list which stays mounted. */}
      <Outlet />
      <WebConsolePanel
        instance={consoleInstance}
        apiClient={apiClient}
        onClose={() => setConsoleInstance(null)}
        consoleHref={(id) => `${basepath}/instances/${id}/console`}
      />
    </div>
  )
}
