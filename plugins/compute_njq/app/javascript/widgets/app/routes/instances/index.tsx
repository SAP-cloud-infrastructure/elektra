import { useState } from "react"
import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { useInstancesQuery } from "../../hooks/useInstanceQueries"
import { InstanceTable } from "./-components/InstanceTable"
import { InstancesToolbar } from "./-components/InstancesToolbar"
import { filterInstances, facetValues } from "./-components/filterInstances"

export const Route = createFileRoute("/instances/")({
  component: Instances,
})

function Instances() {
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
      <InstanceTable instances={filtered} isLoading={isLoading} />
    </div>
  )
}
