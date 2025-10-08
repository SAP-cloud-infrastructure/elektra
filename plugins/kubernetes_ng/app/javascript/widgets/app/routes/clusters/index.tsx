import React from "react"
import { createFileRoute, useLoaderData, Await, CatchBoundary, useRouter } from "@tanstack/react-router"
import { Container, Button } from "@cloudoperators/juno-ui-components"
import ClusterList from "./-components/ClusterList"
import PageHeader from "../../components/PageHeader"
import { Permissions } from "../../types/permissions"
import { Cluster } from "../../types/cluster"

export const Route = createFileRoute("/clusters/")({
  component: Clusters,
  loader: async ({ context }) => {
    const client = context.apiClient
    const clustersPromise = client.gardener.getClusters()
    const permissionsPromise = client.gardener.getPermissions()

    return {
      clustersPromise,
      permissionsPromise,
    }
  },
})

function ClusterActions({
  permissions,
  disabled = false,
  isError,
}: {
  permissions?: Permissions
  disabled?: boolean
  isError?: boolean
}) {
  const router = useRouter()
  return (
    <>
      <Button size="small" label="Refresh" onClick={() => router.invalidate()} disabled={disabled && !isError} />
      <Button size="small" label="Add Cluster" disabled={disabled || !permissions?.create} />
    </>
  )
}

function ClusterContent({
  clusters = [],
  permissions,
  error,
  isLoading = false,
}: {
  clusters?: Cluster[]
  permissions?: Permissions
  error?: Error
  isLoading?: boolean
}) {
  const listError =
    error ?? (permissions?.list === false ? new Error("You do not have permission to view clusters.") : undefined)

  return (
    <Container py px={false}>
      <ClusterList clusters={listError ? [] : clusters} isLoading={isLoading} error={listError} />
    </Container>
  )
}

function Clusters() {
  const { clustersPromise, permissionsPromise } = useLoaderData({ from: Route.id })
  const combinedPromise = Promise.all([clustersPromise, permissionsPromise])

  return (
    <>
      <PageHeader title="Kubernetes Clusters" subtitle="Manage your VM-based Kubernetes deployments">
        <CatchBoundary
          getResetKey={() => "reset"}
          errorComponent={(error) => <ClusterActions disabled isError={!!error} />}
        >
          <Await promise={combinedPromise} fallback={<ClusterActions disabled />}>
            {([_, permissions]) => <ClusterActions permissions={permissions} />}
          </Await>
        </CatchBoundary>
      </PageHeader>

      <CatchBoundary getResetKey={() => "reset"} errorComponent={({ error }) => <ClusterContent error={error} />}>
        <Await promise={combinedPromise} fallback={<ClusterContent isLoading />}>
          {([clusters, permissions]) => <ClusterContent clusters={clusters} permissions={permissions} />}
        </Await>
      </CatchBoundary>
    </>
  )
}

export default Clusters
