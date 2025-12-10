import React, { useState } from "react"
import { createFileRoute, useLoaderData, useRouter, useMatch } from "@tanstack/react-router"
import { Container, Button, Message } from "@cloudoperators/juno-ui-components"
import ClusterList from "./-components/ClusterList"
import PageHeader from "../../components/PageHeader"
import { Permissions } from "../../types/permissions"
import { Cluster } from "../../types/cluster"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import InlineError from "../../components/InlineError"
import CreateClusterWizard from "./-components/CreateClusterWizard"
import { GardenerApi } from "../../apiClient"

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
    const [clusters, permissions] = await Promise.all([
      client.gardener.getClusters(),
      client.gardener.getShootPermissions(),
    ])
    return {
      clusters,
      permissions,
      client,
      region: context.region,
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

function ClusterActions({
  permissions,
  disabled = false,
  onAddCluster,
}: {
  permissions?: Permissions
  disabled?: boolean
  onAddCluster?: () => void
}) {
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
      <Button
        variant="primary"
        size="small"
        label="Add Cluster"
        disabled={disabled || !permissions?.create}
        onClick={onAddCluster}
      />
    </>
  )
}

interface ClustersViewProps {
  clusters?: Cluster[]
  permissions?: Permissions
  error?: Error
  isLoading?: boolean
  client?: GardenerApi
  updatedAt?: number
  region?: string
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
  const { permissions, isLoading = false, client, region } = props
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  return (
    <>
      <Container px={false} py>
        {successMessage && (
          <Message onDismiss={() => setSuccessMessage(null)} text={successMessage} variant="success" autoDismiss />
        )}
      </Container>

      <ClustersPageHeader>
        <ClusterActions permissions={permissions} disabled={isLoading} onAddCluster={() => setShowWizardModal(true)} />
      </ClustersPageHeader>

      {showWizardModal && (!client || !region) && (
        <InlineError error={new Error("Cannot open cluster creation wizard: missing client or region.")} />
      )}

      {showWizardModal && client && region && (
        <CreateClusterWizard
          isOpen={showWizardModal}
          onSuccessCreate={(clusterName) => {
            router.invalidate()
            setSuccessMessage(`Cluster ${clusterName} created successfully.`)
          }}
          onClose={() => {
            setShowWizardModal(false)
          }}
          client={client}
          region={region}
        />
      )}
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
