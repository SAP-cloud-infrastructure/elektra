import React from "react"
import { createFileRoute, useParams, useLoaderData } from "@tanstack/react-router"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { LoaderWithCrumb } from "../-types"
import { Spinner } from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import InlineError from "../../components/InlineError"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { RouterContext } from "../__root"
import { GardenerApi } from "../../apiClient"
import DetailsContent from "./-components/ClusterDetails/DetailsContent"
import MainActions from "./-components/ClusterDetails/MainActions"

export const CLUSTER_DETAIL_ROUTE_ID = "/clusters/$clusterName"

export const RouterConfig = {
  component: ClusterDetailLoader,
  pendingComponent: () => (
    <ClusterDetailErrorBoundary>
      <ClusterDetail isLoading />
    </ClusterDetailErrorBoundary>
  ),
  errorComponent: ({ error }: { error?: Error }) => (
    <ClusterDetailErrorBoundary>
      <ClusterDetail error={error} />
    </ClusterDetailErrorBoundary>
  ),
  loader: async ({
    context,
    params,
  }: {
    context: RouterContext
    params: { clusterName: string }
  }): Promise<
    LoaderWithCrumb & {
      cluster: Cluster
      shootPermissions: Permissions
      kubeconfigPermissions: Permissions
      client: GardenerApi
      updatedAt: number
    }
  > => {
    const client = context.apiClient
    const [cluster, shootPermissions, kubeconfigPermissions] = await Promise.all([
      client.gardener.getClusterByName(params.clusterName),
      client.gardener.getShootPermissions(),
      client.gardener.getKubeconfigPermission(),
    ])
    return {
      crumb: {
        label: `${params.clusterName}`,
      },
      cluster,
      shootPermissions,
      kubeconfigPermissions,
      client,
      updatedAt: Date.now(),
    }
  },
}

export const Route = createFileRoute(CLUSTER_DETAIL_ROUTE_ID)(RouterConfig)

function ClustersDetailPageHeader({ clusterName, children }: { clusterName?: string; children?: React.ReactNode }) {
  return <PageHeader title={`Cluster ${clusterName} Information`}>{children}</PageHeader>
}

function ClusterDetailErrorBoundary({ children }: { children?: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }: FallbackProps) => (
        <>
          <ClustersDetailPageHeader />
          <InlineError error={error} />
        </>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

interface ClusterDetailProps {
  cluster?: Cluster
  shootPermissions?: Permissions
  kubeconfigPermissions?: Permissions
  isLoading?: boolean
  error?: Error
  updatedAt?: number
}

function ClusterDetail({
  cluster,
  shootPermissions,
  kubeconfigPermissions,
  isLoading,
  error,
  updatedAt,
}: ClusterDetailProps) {
  const params = useParams({ from: Route.id })

  const detailsError =
    error ??
    (shootPermissions?.get === false ? new Error("You do not have permission to view cluster details.") : undefined)

  const renderContent = () => {
    if (isLoading) {
      return <Spinner size="small" aria-label="Loading cluster details" />
    }

    if (detailsError) {
      return <InlineError error={detailsError} />
    }

    if (!cluster) {
      return <span role="status">Cluster not found</span>
    }

    return <DetailsContent cluster={cluster} updatedAt={updatedAt} />
  }

  return (
    <>
      <ClustersDetailPageHeader clusterName={params.clusterName}>
        <MainActions
          shootPermissions={shootPermissions}
          kubeconfigPermissions={kubeconfigPermissions}
          disabled={isLoading || cluster?.isDeleted}
          disabledMessage={cluster?.isDeleted ? "Cluster is deleted and actions are disabled" : undefined}
        />
      </ClustersDetailPageHeader>
      {renderContent()}
    </>
  )
}

function ClusterDetailLoader() {
  const props = useLoaderData({ from: Route.id })
  return (
    <ClusterDetailErrorBoundary>
      <ClusterDetail {...props} />
    </ClusterDetailErrorBoundary>
  )
}
