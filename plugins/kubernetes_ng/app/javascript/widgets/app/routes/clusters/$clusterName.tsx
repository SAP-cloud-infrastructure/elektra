import React from "react"
import { createFileRoute, useParams, useLoaderData, useRouter, useMatch } from "@tanstack/react-router"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { LoaderWithCrumb } from "../-types"
import { Button, Container, Spinner, Message } from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import InlineError, { normalizeError } from "../../components/InlineError"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { RouterContext } from "../__root"
import { GardenerApi } from "../../apiClient"
import { useMutation, UseMutationResult } from "@tanstack/react-query"
import DetailsContent from "./-components/ClusterDetails/DetailsContent"
import DeleteDialog from "./-components/ClusterDetails/DeleteDialog"

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

function ClusterDetailActions({
  shootPermissions,
  kubeconfigPermissions,
  disabled = false,
  kubeconfigMutation,
  deleteMutation,
}: {
  shootPermissions?: Permissions
  kubeconfigPermissions?: Permissions
  disabled?: boolean
  kubeconfigMutation: UseMutationResult<string, Error, void, unknown>
  deleteMutation?: UseMutationResult<Cluster, Error, void, unknown>
}) {
  const router = useRouter()
  const match = useMatch({ from: Route.id })
  const params = useParams({ from: Route.id })
  const isFetching = match.isFetching === "loader"
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

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
        size="small"
        label="Kube Config"
        icon="download"
        title="Download Kube Config valid for 8 hours"
        disabled={disabled || kubeconfigMutation.isPending || !kubeconfigPermissions?.create}
        progress={kubeconfigMutation.isPending}
        onClick={() => kubeconfigMutation.mutate()}
      />
      <Button
        size="small"
        label="Delete Cluster"
        variant="primary-danger"
        disabled={disabled || !shootPermissions?.delete}
        onClick={() => setShowDeleteDialog(true)}
      />
      <DeleteDialog
        clusterName={params.clusterName}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation?.mutate()}
        isDeleting={false}
      />
    </>
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

  const deleteMutation = useMutation<Cluster, Error, void>({
    mutationFn: async () => {
      return client.gardener.confirm_deletion_and_destroy(params.clusterName)
    },
  })

  const kubeconfigMutation = useMutation<string, Error, void>({
    mutationFn: async () => {
      return client.gardener.getKubeconfig(params.clusterName)
    },

    onSuccess: (kubeconfigYaml) => {
      // Create a file-like object in memory from the YAML
      const blob = new Blob([kubeconfigYaml], {
        type: "application/x-yaml",
      })

      // Create a temporary URL pointing to the in-memory file
      const url = URL.createObjectURL(blob)

      // Create a temporary anchor element to trigger the download
      const a = document.createElement("a")
      a.href = url
      a.download = `${params.clusterName}-kubeconfig.yaml`

      // Required for Safari / Firefox compatibility
      document.body.appendChild(a)
      a.click()
      a.remove()

      // Revoke the object URL after the download has been triggered
      setTimeout(() => URL.revokeObjectURL(url), 0)
    },
  })

  return (
    <>
      {kubeconfigMutation.error instanceof Error && (
        <Container px={false} py>
          <Message
            text={normalizeError(kubeconfigMutation.error).title + normalizeError(kubeconfigMutation.error).message}
            variant="error"
            dismissible
          />
        </Container>
      )}
      <ClustersDetailPageHeader clusterName={params.clusterName}>
        <ClusterDetailActions
          shootPermissions={shootPermissions}
          kubeconfigPermissions={kubeconfigPermissions}
          disabled={isLoading}
          kubeconfigMutation={kubeconfigMutation}
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
