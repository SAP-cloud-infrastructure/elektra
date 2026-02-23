import React from "react"
import { createFileRoute, useParams, useLoaderData, useRouter, useMatch } from "@tanstack/react-router"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { LoaderWithCrumb } from "../-types"
import { Spinner } from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import InlineError from "../../components/InlineError"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { RouterContext } from "../__root"
import { GardenerApi } from "../../apiClient"
import { useMutation } from "@tanstack/react-query"
import DetailsContent from "./-components/ClusterDetails/DetailsContent"
import MainActions from "./-components/ClusterDetails/MainActions"
import { NotificationProvider, useNotification } from "../../components/NotificationProvider"

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
  const match = useMatch({ from: Route.id })
  const client = match.context.apiClient
  const { showSuccess, showError, clearErrorNotification } = useNotification()
  const router = useRouter()

  const replaceClusterMutation = useMutation<Cluster, Error, object>({
    mutationFn: async (rawResource: object) => {
      return client.gardener.replaceCluster(params.clusterName, rawResource)
    },
    onSuccess: () => {
      clearErrorNotification()
      showSuccess("Cluster updated successfully")
      router.invalidate()
    },
    onError: (error) => {
      showError(error)
    },
  })

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

    return (
      <DetailsContent
        cluster={cluster}
        updatedAt={updatedAt}
        onYamlSave={(newValue) => replaceClusterMutation.mutate(newValue)}
        isReplacingCluster={replaceClusterMutation.isPending}
      />
    )
  }

  return (
    <>
      <ClustersDetailPageHeader clusterName={params.clusterName}>
        <MainActions
          shootPermissions={shootPermissions}
          kubeconfigPermissions={kubeconfigPermissions}
          disabled={isLoading || cluster?.isDeleted}
          client={client}
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
      <NotificationProvider>
        <ClusterDetail {...props} />
      </NotificationProvider>
    </ClusterDetailErrorBoundary>
  )
}
