import React from "react"
import { createFileRoute, useParams, useLoaderData, useRouter, useMatch } from "@tanstack/react-router"
import { Cluster } from "../../types/cluster"
import { Permissions } from "../../types/permissions"
import { LoaderWithCrumb } from "../-types"
import {
  JsonViewer,
  Button,
  Container,
  DataGrid,
  DataGridRow,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import ClipboardText from "../../components/ClipboardText"
import ReadinessConditions from "../../components/ReadinessConditions"
import InlineError from "../../components/InlineError"
import WorkerList from "./-components/WorkerList"
import ClusterDetailRow from "./-components/ClusterDetailRow"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { RouterContext } from "../__root"

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
      permissions: Permissions
      updatedAt: number
    }
  > => {
    const client = context.apiClient
    const [cluster, permissions] = await Promise.all([
      client.gardener.getClusterByName(params.clusterName),
      client.gardener.getPermissions(),
    ])
    return {
      crumb: {
        label: `${params.clusterName}`,
      },
      cluster,
      permissions,
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

function ClusterDetailActions({ permissions, disabled = false }: { permissions?: Permissions; disabled?: boolean }) {
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
        size="small"
        label="Delete Cluster"
        variant="primary-danger"
        disabled={disabled || !permissions?.delete}
      />
      <Button size="small" label="Edit Cluster" disabled={disabled || !permissions?.update} />
    </>
  )
}

const sectionHeaderStyles = "details-section tw-text-lg tw-font-bold tw-mb-4"

function clusterDetailContent({ cluster, updatedAt }: { cluster: Cluster; updatedAt?: number }) {
  return (
    <div className="tw-relative">
      <div className="tw-absolute tw-right-0 tw-top-6 tw-text-sm" data-testid="cluster-details-updated-at">
        {updatedAt && <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>}
      </div>
      <Tabs>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>JSON</Tab>
        </TabList>
        <TabPanel>
          {/* Basic info */}
          <Container py px={false}>
            <p className={sectionHeaderStyles}>Basic Information</p>
            <DataGrid columns={2} gridColumnTemplate="50% 50%">
              <DataGridRow>
                <div>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Name">{cluster.name}</ClusterDetailRow>
                    <ClusterDetailRow label="ID">
                      <ClipboardText text={cluster.uid} />
                    </ClusterDetailRow>
                    <ClusterDetailRow label="Cluster Status">{cluster.status}</ClusterDetailRow>
                    <ClusterDetailRow label="Kubernetes Version">{cluster.version}</ClusterDetailRow>
                    <ClusterDetailRow label="Namespace">{cluster.namespace}</ClusterDetailRow>
                  </DataGrid>
                </div>
                <div>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Purpose">{cluster.purpose}</ClusterDetailRow>
                    <ClusterDetailRow label="Add ons"></ClusterDetailRow>
                    <ClusterDetailRow label="Created by"></ClusterDetailRow>
                  </DataGrid>
                </div>
              </DataGridRow>
            </DataGrid>
          </Container>

          {/* Readiness Conditions */}
          <Container py px={false}>
            <p className={sectionHeaderStyles}>Readiness</p>
            {cluster?.readiness?.conditions?.length > 0 ? (
              <DataGrid columns={2} gridColumnTemplate="17.5% auto">
                <ClusterDetailRow label="Readiness">
                  <ReadinessConditions conditions={cluster?.readiness?.conditions} showDetails />
                </ClusterDetailRow>
              </DataGrid>
            ) : (
              <p>No readiness conditions found.</p>
            )}
          </Container>

          {/* Cluster Labels */}
          <Container py px={false}>
            <p className={sectionHeaderStyles}>Labels</p>
            {cluster.labels && Object.keys(cluster.labels).length > 0 ? (
              <DataGrid columns={2} minContentColumns={[0]}>
                {Object.entries(cluster.labels).map(([key, value]) => (
                  <ClusterDetailRow key={key} label={key}>
                    {value}
                  </ClusterDetailRow>
                ))}
              </DataGrid>
            ) : (
              <p>No labels found.</p>
            )}
          </Container>

          {/* Maintenance and auto update */}
          <DataGrid columns={2} gridColumnTemplate="50% 50%">
            <DataGridRow>
              <Container py px={false}>
                <p className={sectionHeaderStyles}>Maintenace Window</p>
                <DataGrid columns={2} gridColumnTemplate="35% auto">
                  <ClusterDetailRow label="Start Time">{cluster.maintenance?.startTime}</ClusterDetailRow>
                  <ClusterDetailRow label="Window Time">{cluster.maintenance?.windowTime}</ClusterDetailRow>
                  <ClusterDetailRow label="Timezone">{cluster.maintenance?.timezone}</ClusterDetailRow>
                </DataGrid>
              </Container>
              <Container py px={false}>
                <p className={sectionHeaderStyles}>Auto Update</p>
                <DataGrid columns={2} gridColumnTemplate="35% auto">
                  <ClusterDetailRow label="OS Updates">{cluster.autoUpdate?.os}</ClusterDetailRow>
                  <ClusterDetailRow label="Kubernetes Updates">{cluster.autoUpdate?.kubernetes}</ClusterDetailRow>
                </DataGrid>
              </Container>
            </DataGridRow>
          </DataGrid>

          {/* Workers */}
          <Container py px={false}>
            <p className={sectionHeaderStyles}>Worker Pools</p>
            <WorkerList workers={cluster.workers} />
          </Container>
        </TabPanel>
        <TabPanel>
          <Container py px={false}>
            <JsonViewer expanded={2} data={cluster.raw} toolbar data-testid="json-viewer" />
          </Container>
        </TabPanel>
      </Tabs>
    </div>
  )
}

interface ClusterDetailProps {
  cluster?: Cluster
  permissions?: Permissions
  isLoading?: boolean
  error?: Error
  updatedAt?: number
}

function ClusterDetail({ cluster, permissions, isLoading, error, updatedAt }: ClusterDetailProps) {
  const params = useParams({ from: Route.id })

  const detailsError =
    error ?? (permissions?.get === false ? new Error("You do not have permission to view cluster details.") : undefined)

  const renderContent = () => {
    if (isLoading) {
      return <Spinner size="small" aria-label="Loading cluster details" data-testid="cluster-details-loading-state" />
    }

    if (detailsError) {
      return <InlineError error={detailsError} />
    }

    if (!cluster) {
      return <span role="status">Cluster not found</span>
    }

    return clusterDetailContent({ cluster, updatedAt })
  }

  return (
    <>
      <ClustersDetailPageHeader clusterName={params.clusterName}>
        <ClusterDetailActions permissions={permissions} disabled={isLoading} />
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

export default ClusterDetailLoader
