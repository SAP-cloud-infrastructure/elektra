import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { useInstancesQuery } from "../../hooks/useInstanceQueries"
import { InstanceTable } from "./-components/InstanceTable"

export const Route = createFileRoute("/instances/")({
  component: Instances,
})

function Instances() {
  const { apiClient } = useRouteContext({ from: Route.id })
  const { data: instances, isLoading, isError, error } = useInstancesQuery(apiClient)

  return (
    <div>
      {isError && (
        <div className="alert alert-danger" role="alert">
          <strong>Failed to load instances.</strong>
          {error?.message && <span className="ms-1">{error.message}</span>}
        </div>
      )}
      {isLoading ? (
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading instances…</span>
        </div>
      ) : (
        <InstanceTable instances={instances ?? []} />
      )}
    </div>
  )
}
