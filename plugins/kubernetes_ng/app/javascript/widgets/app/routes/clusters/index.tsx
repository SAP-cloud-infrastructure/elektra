import React, { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Container } from "@cloudoperators/juno-ui-components"
import ClusterList from "./-components/ClusterList"
import PageHeader from "../../components/PageHeader"
import { Permissions } from "../../types/permissions"
import { Cluster } from "../../types/cluster"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import InlineError from "../../components/InlineError"
import CreateClusterWizard from "./-components/CreateClusterWizard"
import { GardenerApi } from "../../apiClient"
import DisableableButton from "../../components/DisableableButton"
import { useActions } from "@cloudoperators/juno-messages-provider"
import HeadingInfo from "./-components/HeadingInfo"
import { useClustersQuery, useShootPermissionsQuery } from "../../hooks/useClusterQueries"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "../../hooks/queryKeys"

export const CLUSTERS_ROUTE_ID = "/clusters/"

export const Route = createFileRoute(CLUSTERS_ROUTE_ID)({
  component: ClustersWithQueries,
  // Provide the context through the route so it's available in the component
  beforeLoad: ({ context }) => {
    return {
      apiClient: context.apiClient,
      region: context.region,
    }
  },
})

function ClustersPageHeader({ children }: { children?: React.ReactNode }) {
  return <PageHeader title="Kubernetes Clusters">{children}</PageHeader>
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
  // Determine the disabled message for Add Cluster button
  const getAddClusterDisabledMessage = () => {
    if (!permissions) return "Permissions are not available"
    if (!permissions.create) return "You don't have permission to create clusters"
    return undefined
  }

  return (
    <DisableableButton
      variant="primary"
      size="small"
      label="Add Cluster"
      disabled={disabled || !permissions?.create}
      onClick={onAddCluster}
      disabledMessage={getAddClusterDisabledMessage()}
    />
  )
}

interface ClustersViewProps {
  clusters?: Cluster[]
  permissions?: Permissions
  error?: Error
  isLoading?: boolean
  isFetching?: boolean
  client?: GardenerApi
  updatedAt?: number
  region?: string
  onRefreshClusters: () => void
}

function ClusterContent({
  clusters = [],
  permissions,
  error,
  isLoading = false,
  updatedAt,
  isFetching,
  onRefreshClusters,
}: ClustersViewProps) {
  const listError =
    error ?? (permissions?.list === false ? new Error("You do not have permission to view clusters.") : undefined)

  return (
    <Container py px={false}>
      <ClusterList
        clusters={listError ? [] : clusters}
        isLoading={isLoading}
        error={listError}
        updatedAt={updatedAt}
        isFetching={isFetching}
        onRefresh={onRefreshClusters}
      />
    </Container>
  )
}

function Clusters(props: ClustersViewProps) {
  const { permissions, isLoading = false, client, region, onRefreshClusters } = props
  const [showWizardModal, setShowWizardModal] = useState(false)
  const { addMessage, resetMessages } = useActions()

  return (
    <>
      <ClustersPageHeader>
        <ClusterActions permissions={permissions} disabled={isLoading} onAddCluster={() => setShowWizardModal(true)} />
      </ClustersPageHeader>

      <HeadingInfo />

      {showWizardModal && (!client || !region) && (
        <InlineError error={new Error("Cannot open cluster creation wizard: missing client or region.")} />
      )}
      {showWizardModal && client && region && (
        <CreateClusterWizard
          isOpen={showWizardModal}
          onSuccessCreate={(clusterName) => {
            onRefreshClusters()
            resetMessages()
            addMessage({
              text: `Cluster ${clusterName} is being bootstrapped. This may take a few minutes.`,
              variant: "success",
            })
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

function ClustersWithQueries() {
  const { apiClient, region } = Route.useRouteContext()
  const queryClient = useQueryClient()

  const {
    data: clusters,
    isLoading: clustersLoading,
    error: clustersError,
    isFetching: clustersFetching,
    dataUpdatedAt,
  } = useClustersQuery(apiClient)

  const {
    data: permissions,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useShootPermissionsQuery(apiClient)

  const isLoading = clustersLoading || permissionsLoading
  // TanStack Query v4 returns null when there's no error, convert to undefined
  const error = clustersError || permissionsError || undefined

  // Disable all actions when there's an error fetching either clusters or permissions
  const validPermissions = error ? undefined : permissions

  // if there is an error, independently of fetching either clusters or permissions, we show an error state,
  // so we don't want to show a stale updatedAt timestamp in that case
  const validUpdatedAt = !error && dataUpdatedAt > 0 ? dataUpdatedAt : undefined

  const handleRefreshClusters = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clusters })
  }

  return (
    <ClustersErrorBoundary>
      <Clusters
        clusters={clusters}
        permissions={validPermissions}
        error={error}
        isLoading={isLoading}
        isFetching={clustersFetching}
        client={apiClient}
        region={region}
        updatedAt={validUpdatedAt}
        onRefreshClusters={handleRefreshClusters}
      />
    </ClustersErrorBoundary>
  )
}
