import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { IntroBox, Message, Spinner } from "@cloudoperators/juno-ui-components"
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
      <IntroBox text="Instances in this project, aggregated server-side from compute, network and image APIs." />
      {isError && <Message variant="error" title="Failed to load instances" text={error?.message} />}
      {isLoading ? (
        <Spinner size="small" aria-label="Loading instances" />
      ) : (
        <InstanceTable instances={instances ?? []} />
      )}
    </div>
  )
}
