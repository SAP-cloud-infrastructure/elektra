import React from "react"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { z } from "zod"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { LoaderWithCrumb } from "../-types"
import PageHeader from "../../components/PageHeader"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import DetailsContent from "./-components/ClusterDetails/DetailsContent"
import MainActions from "./-components/ClusterDetails/MainActions"
import InlineError from "../../components/InlineError"
import { useClusterQuery, useShootPermissionsQuery, useKubeconfigPermissionsQuery } from "../../hooks/useClusterQueries"
import { RouterContext } from "../__root"

export const CLUSTER_DETAIL_ROUTE_ID = "/clusters/$clusterName"

const clusterDetailSearchSchema = z.object({
  tab: z.enum(["overview", "yaml"]).optional().default("overview"),
})

export type ClusterDetailTab = "overview" | "yaml"

export const RouterConfig = {
  component: ClusterDetailWithQueries,
  validateSearch: clusterDetailSearchSchema,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    return {
      apiClient: context.apiClient,
    }
  },
  loader: async ({ params }: { params: { clusterName: string } }): Promise<LoaderWithCrumb> => {
    return {
      crumb: {
        label: `${params.clusterName}`,
      },
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
  isFetching?: boolean
  error?: Error
  updatedAt?: number
}

function ClusterDetail({
  cluster,
  shootPermissions,
  kubeconfigPermissions,
  isLoading,
  isFetching,
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
        isFetching={isFetching}
        shootPermissions={shootPermissions}
        error={getError()}
        isLoading={isLoading}
      />
    </>
  )
}

function ClusterDetailWithQueries() {
  const { apiClient } = Route.useRouteContext()
  const params = useParams({ from: Route.id })

  const {
    data: cluster,
    isLoading: clusterLoading,
    error: clusterError,
    isFetching: clusterFetching,
    dataUpdatedAt,
  } = useClusterQuery(apiClient, params.clusterName)

  const {
    data: shootPermissions,
    isLoading: shootPermissionsLoading,
    error: shootPermissionsError,
  } = useShootPermissionsQuery(apiClient)

  const {
    data: kubeconfigPermissions,
    isLoading: kubeconfigPermissionsLoading,
    error: kubeconfigPermissionsError,
  } = useKubeconfigPermissionsQuery(apiClient)

  const isLoading = clusterLoading || shootPermissionsLoading || kubeconfigPermissionsLoading
  // TanStack Query v4 returns null when there's no error, convert to undefined
  const error = clusterError || shootPermissionsError || kubeconfigPermissionsError || undefined

  // Disable all actions when there's an error fetching cluster or permissions
  const validShootPermissions = error ? undefined : shootPermissions
  const validKubeconfigPermissions = error ? undefined : kubeconfigPermissions

  // Don't show stale updatedAt timestamp when there's an error
  const validUpdatedAt = !error && dataUpdatedAt > 0 ? dataUpdatedAt : undefined

  return (
    <ClusterDetailErrorBoundary>
      <ClusterDetail
        cluster={cluster}
        shootPermissions={validShootPermissions}
        kubeconfigPermissions={validKubeconfigPermissions}
        error={error}
        isLoading={isLoading}
        isFetching={clusterFetching}
        updatedAt={validUpdatedAt}
      />
    </ClusterDetailErrorBoundary>
  )
}
