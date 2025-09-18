import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Cluster } from "../../types/clusters"
import { LoaderWithCrumb } from "../-types"
import { JsonViewer, Container } from "@cloudoperators/juno-ui-components"

export const Route = createFileRoute("/clusters/$clusterName")({
  component: ClusterDetail,
  loader: async ({ context, params }): Promise<LoaderWithCrumb & { cluster: Cluster }> => {
    const client = context.apiClient
    const details = await client
      ?.get<{ data: Cluster }>(`/kubernetes-ng/api/clusters/${params.clusterName}/`)
      .then((response) => response.data)

    // const permissions = await context.trpcClient?.gardener.getPermissions.query()

    return {
      crumb: {
        label: `${params.clusterName}`,
      },
      cluster: details || ({} as Cluster),
    }
  },
})

function ClusterDetail() {
  const { cluster } = Route.useLoaderData()
  return (
    <Container py px={false}>
      <JsonViewer expanded={1} data={cluster} />
    </Container>
  )
}
