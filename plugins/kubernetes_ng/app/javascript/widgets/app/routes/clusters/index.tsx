import React, { useState } from "react"
import { createFileRoute, useLoaderData, useRouter, useMatch } from "@tanstack/react-router"
import { Container, IntroBox, CodeBlock } from "@cloudoperators/juno-ui-components"
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
  // Determine the disabled message for Add Cluster button
  const getAddClusterDisabledMessage = () => {
    if (!permissions) return "Permissions are not available"
    if (!permissions.create) return "You don't have permission to create clusters"
    return undefined
  }

  return (
    <>
      <DisableableButton
        variant="primary"
        size="small"
        label="Add Cluster"
        disabled={disabled || !permissions?.create}
        onClick={onAddCluster}
        disabledMessage={getAddClusterDisabledMessage()}
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
  const router = useRouter()
  const match = useMatch({ from: Route.id })
  const isFetching = match.isFetching === "loader"

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
        onRefresh={() => router.invalidate()}
      />
    </Container>
  )
}

function Clusters(props: ClustersViewProps) {
  const { permissions, isLoading = false, client, region } = props
  const [showWizardModal, setShowWizardModal] = useState(false)
  const router = useRouter()
  const { addMessage, resetMessages } = useActions()

  return (
    <>
      <IntroBox variant="default" className="tw-mt-6">
        <p>
          For conveniently managing your clusters with kubectl, first install the scikube CLI utility, then generate the
          kubeconfig file for your OpenStack domain/project. Download the latest source code zip/tarball, then:
        </p>

        <CodeBlock
          content={`# Generic instructions: all platforms
PERSEPHONE_VERSION='0.2.0'
unzip persephone-"$PERSEPHONE_VERSION".zip
cd persephone-"$PERSEPHONE_VERSION"
make build/scikube && ./build/scikube -h`}
        />
        <p>
          Make sure to include scikube in your shell PATH. Finally, set up your OpenStack variables and create your
          "garden kubeconfig" file as follows:
        </p>

        <CodeBlock
          content={`source "<your-openstack-rc-file.sh>" 
# create kubeconfig file
scikube kubeconfig-for-garden --landscape canary > kubeconfig-for-garden.yaml
# list your domain/project clusters
KUBECONFIG=kubeconfig-for-garden.yaml kubectl get shoot
# create a new cluster on your domain/project
KUBECONFIG=kubeconfig-for-garden.yaml kubectl apply -f "<your-new-shoot-manifest.yaml>"`}
        />
      </IntroBox>

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

function ClustersLoader() {
  const props = useLoaderData({ from: Route.id })

  return (
    <ClustersErrorBoundary>
      <Clusters {...props} />
    </ClustersErrorBoundary>
  )
}
