import { createFileRoute, useLoaderData } from "@tanstack/react-router"
import { JsonViewer } from "@cloudoperators/juno-ui-components"
import { Cluster } from "../../types/clusters"

export const Route = createFileRoute("/clusters/")({
  component: Index,
  loader: async ({ context }) => {
    const clusters = await context.apiClient
      ?.get("/kubernetes-ng/api/clusters/")
      .then((response: { data: Cluster[] }) => response.data)

    return {
      clusters,
    }
  },
})

function Index() {
  const { clusters } = useLoaderData({ from: Route.id })

  return <JsonViewer data={clusters} />
}
