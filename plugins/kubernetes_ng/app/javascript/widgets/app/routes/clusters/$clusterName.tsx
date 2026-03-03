import React from "react"
import { createFileRoute, useParams, useLoaderData } from "@tanstack/react-router"
import { z } from "zod"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { LoaderWithCrumb } from "../-types"
import PageHeader from "../../components/PageHeader"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { RouterContext } from "../__root"
import { GardenerApi } from "../../apiClient"
import DetailsContent from "./-components/ClusterDetails/DetailsContent"
import MainActions from "./-components/ClusterDetails/MainActions"
import InlineError from "../../components/InlineError"

export const CLUSTER_DETAIL_ROUTE_ID = "/clusters/$clusterName"

const clusterDetailSearchSchema = z.object({
  tab: z.enum(["overview", "yaml"]).optional().default("overview"),
})

export type ClusterDetailTab = "overview" | "yaml"

export const RouterConfig = {
  component: ClusterDetailLoader,
  validateSearch: clusterDetailSearchSchema,
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

  // Determine the error to display
  const getError = () => {
    if (error) return error
    if (shootPermissions?.get === false) return new Error("You do not have permission to view cluster details.")
    if (!isLoading && !cluster) return new Error("Cluster not found")
    if (!isLoading && !shootPermissions) return new Error("Permissions failed to load")
    return undefined
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
      <DetailsContent
        cluster={cluster}
        updatedAt={updatedAt}
        shootPermissions={shootPermissions}
        error={getError()}
        isLoading={isLoading}
      />
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
