import { createFileRoute, useRouteContext, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { CreateInstanceForm } from "./-components/CreateInstanceForm"

export const Route = createFileRoute("/instances/new")({
  component: NewInstance,
})

function NewInstance() {
  const { apiClient } = useRouteContext({ from: Route.id })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return (
    <div className="card">
      <div className="card-header">
        <h4>Create New Instance</h4>
      </div>
      <div className="card-body">
        <CreateInstanceForm
          api={apiClient}
          queryClient={queryClient}
          onSuccess={() => navigate({ to: "/instances" })}
        />
      </div>
    </div>
  )
}
