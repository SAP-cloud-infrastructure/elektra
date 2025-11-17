import React from "react"
import { createFileRoute, useLoaderData, useRouter, useMatch } from "@tanstack/react-router"
import { Container, Button } from "@cloudoperators/juno-ui-components"
import ClusterList from "./-components/ClusterList"
import PageHeader from "../../components/PageHeader"
import { Permissions } from "../../types/permissions"
import { Cluster } from "../../types/cluster"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import InlineError from "../../components/InlineError"

export const CLUSTERS_ROUTE_ID = "/clusters/"

export const Route = createFileRoute(CLUSTERS_ROUTE_ID)({
  component: ClustersLoader,
  pendingComponent: () => (
    <ClustersErrorBoundary>
      <Clusters isLoading />
    </ClustersErrorBoundary>
  ),
  errorComponent: ({ error }) => (
    <ClustersErrorBoundary>
      <Clusters error={error} />
    </ClustersErrorBoundary>
  ),
  loader: async ({ context }) => {
    const client = context.apiClient
    const [clusters, permissions] = await Promise.all([client.gardener.getClusters(), client.gardener.getPermissions()])
    return {
      clusters,
      permissions,
      updatedAt: Date.now(),
    }
  },
})

function ClustersPageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <PageHeader title="Kubernetes Clusters" subtitle="Manage your VM-based Kubernetes deployments">
      {children}
    </PageHeader>
  )
}

function ClustersErrorBoundary({ children }: { children?: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }: FallbackProps) => (
        <>
          <ClustersPageHeader />
          <InlineError error={error} />
        </>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

function ClusterActions({ permissions, disabled = false }: { permissions?: Permissions; disabled?: boolean }) {
  const router = useRouter()
  const match = useMatch({ from: Route.id })
  const isFetching = match.isFetching === "loader"
  return (
    <>
      <Button
        size="small"
        label="Refresh"
        progress={isFetching && !disabled}
        onClick={() => {
          router.invalidate()
        }}
        disabled={disabled}
      />
      <Button variant="primary" size="small" label="Add Cluster" disabled={disabled || !permissions?.create} />
    </>
  )
}

interface ClustersViewProps {
  clusters?: Cluster[]
  permissions?: Permissions
  error?: Error
  isLoading?: boolean
  updatedAt?: number
}

function ClusterContent({ clusters = [], permissions, error, isLoading = false, updatedAt }: ClustersViewProps) {
  const listError =
    error ?? (permissions?.list === false ? new Error("You do not have permission to view clusters.") : undefined)

  return (
    <Container py px={false}>
      <ClusterList clusters={listError ? [] : clusters} isLoading={isLoading} error={listError} updatedAt={updatedAt} />
    </Container>
  )
}

function Clusters(props: ClustersViewProps) {
  const { permissions, isLoading = false } = props
  return (
    <>
      <ClustersPageHeader>
        <ClusterActions permissions={permissions} disabled={isLoading} />
      </ClustersPageHeader>
      <ClusterContent {...props} />
    </>
  )
}

function ClustersLoader() {
  const props = useLoaderData({ from: Route.id })

  return (
    <ClustersErrorBoundary>
      <Clusters {...props} />
    </ClustersErrorBoundary>
  )
}

export default ClustersLoader
