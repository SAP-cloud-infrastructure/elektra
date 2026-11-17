import { useState } from "react"
import { createFileRoute, useRouteContext, Outlet } from "@tanstack/react-router"
import { useInstancesQuery } from "../../hooks/useInstanceQueries"
import { InstanceTable } from "./-components/InstanceTable"
import { InstancesToolbar } from "./-components/InstancesToolbar"
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
  const { apiClient } = useRouteContext({ from: Route.id })
  const { data: instances, isLoading, isError, error } = useInstancesQuery(apiClient)
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState("")
  const [az, setAz] = useState("")

  const all = instances ?? []
  const { statuses, azs } = facetValues(all)
  const filtered = filterInstances(all, { term: searchTerm, status, az })

  return (
    <div>
      {isError && (
        <div className="alert alert-danger" role="alert">
          <strong>Failed to load instances.</strong>
          {error?.message && <span className="ms-1">{error.message}</span>}
        </div>
      )}
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
      />
      {/* scope is {} for now: the lifecycle policy rules evaluate without a
          target. TODO(step-2): thread scoped_domain_name/project for targeted
          policy checks once the modal actions need them. */}
      <InstanceTable instances={filtered} isLoading={isLoading} apiClient={apiClient} scope={{}} />
      {/* The /instances/new and /instances/$id modals render here, over the list which stays mounted. */}
      <Outlet />
    </div>
  )
}
