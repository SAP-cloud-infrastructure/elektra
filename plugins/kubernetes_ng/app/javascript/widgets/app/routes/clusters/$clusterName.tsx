import React, { useState } from "react"
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
  Grid,
  GridRow,
  GridColumn,
  Icon,
  Stack,
} from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import ClipboardText from "../../components/ClipboardText"
import ReadinessConditions from "../../components/ReadinessConditions"
import InlineError from "../../components/InlineError"
import WorkerList from "./-components/WorkerList"
import ClusterDetailRow from "./-components/ClusterDetailRow"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { RouterContext } from "../__root"
import LastErrors from "./-components/LastErrors"
import Box from "../../components/Box"
import Collapse from "../../components/Collapse"

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
    </>
  )
}

const sectionHeaderStyles = "details-section tw-text-lg tw-font-bold tw-mb-4"

const ClusterDetailContent = ({ cluster, updatedAt }: { cluster: Cluster; updatedAt?: number }) => {
  const [showLastOperation, setShowLastOperation] = useState(false)
  return (
    <Container px={false} py>
      <div className="tw-relative">
        <div className="tw-absolute tw-right-0 tw-top-6 tw-text-sm">
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
              <h2 className={sectionHeaderStyles}>Basic Information</h2>
              <DataGrid columns={2} gridColumnTemplate="35% auto">
                <ClusterDetailRow label="Name">{cluster.name}</ClusterDetailRow>
                <ClusterDetailRow label="ID">
                  <ClipboardText text={cluster.uid} />
                </ClusterDetailRow>
                <ClusterDetailRow label="Cluster Status">{cluster.status}</ClusterDetailRow>
                <ClusterDetailRow label="Kubernetes Version">{cluster.version}</ClusterDetailRow>
                <ClusterDetailRow label="Namespace">
                  <ClipboardText text={cluster.namespace} />
                </ClusterDetailRow>
                <ClusterDetailRow label="Purpose">{cluster.purpose}</ClusterDetailRow>
                <ClusterDetailRow label="Add ons">{cluster.addOns?.join(", ")}</ClusterDetailRow>
                <ClusterDetailRow label="Created by">{cluster.createdBy}</ClusterDetailRow>
              </DataGrid>
            </Container>

            {/* Readiness Conditions */}
            <Container py px={false}>
              <h2 className={sectionHeaderStyles}>Readiness</h2>
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

            {/* Latest Operation & Errors */}
            <Container py px={false}>
              <h2 className={sectionHeaderStyles}>Latest Operation & Errors</h2>
              <DataGrid columns={2} gridColumnTemplate="17.5% auto">
                {cluster.lastErrors && cluster.lastErrors.length > 0 && (
                  <ClusterDetailRow label="Errors">
                    <LastErrors errors={cluster?.lastErrors} />
                  </ClusterDetailRow>
                )}
                {cluster.lastOperation && (
                  <>
                    <ClusterDetailRow label="Operation">
                      <Stack direction="vertical" gap="1">
                        <button
                          type="button"
                          onClick={() => setShowLastOperation((prev) => !prev)}
                          className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
                          aria-expanded={showLastOperation}
                          aria-controls="last-operation"
                          id="last-operation-toggle"
                        >
                          {showLastOperation ? "Hide last operation" : "Show last operation"}
                          <Icon color="global-text" icon={showLastOperation ? "expandLess" : "expandMore"} />
                        </button>
                        <Collapse
                          isOpen={showLastOperation}
                          id="last-operation"
                          aria-labelledby="last-operation-toggle"
                        >
                          <Box variant="default">
                            <Grid>
                              <GridRow>
                                <GridColumn cols={2} className="tw-text-right">
                                  <strong>Description</strong>
                                </GridColumn>
                                <GridColumn cols={10}>{cluster.lastOperation?.description}</GridColumn>
                              </GridRow>
                              <GridRow>
                                <GridColumn cols={2} className="tw-text-right">
                                  <strong>Progress</strong>
                                </GridColumn>
                                <GridColumn cols={10}>{cluster.lastOperation?.progress}</GridColumn>
                              </GridRow>
                              <GridRow>
                                <GridColumn cols={2} className="tw-text-right">
                                  <strong>State</strong>
                                </GridColumn>
                                <GridColumn cols={10}>{cluster.lastOperation?.state}</GridColumn>
                              </GridRow>
                              <GridRow>
                                <GridColumn cols={2} className="tw-text-right">
                                  <strong>Type</strong>
                                </GridColumn>
                                <GridColumn cols={10}>{cluster.lastOperation?.type}</GridColumn>
                              </GridRow>
                              <GridRow>
                                <GridColumn cols={2} className="tw-text-right">
                                  <strong>Update Time</strong>
                                </GridColumn>
                                <GridColumn cols={10}>
                                  {new Date(cluster.lastOperation?.lastUpdateTime).toLocaleString()}
                                </GridColumn>
                              </GridRow>
                            </Grid>
                          </Box>
                        </Collapse>
                      </Stack>
                    </ClusterDetailRow>
                  </>
                )}
              </DataGrid>
            </Container>

            {/* Workers */}
            <Container py px={false}>
              <h2 className={sectionHeaderStyles}>Worker Pools</h2>
              <WorkerList workers={cluster.workers} />
            </Container>

            {/* Maintenance and auto update */}
            <DataGrid columns={2} gridColumnTemplate="50% 50%">
              <DataGridRow>
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Maintenance Window</h2>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="Start Time">{cluster.maintenance?.startTime}</ClusterDetailRow>
                    <ClusterDetailRow label="Window Time">{cluster.maintenance?.windowTime}</ClusterDetailRow>
                    <ClusterDetailRow label="Timezone">{cluster.maintenance?.timezone}</ClusterDetailRow>
                  </DataGrid>
                </Container>
                <Container py px={false}>
                  <h2 className={sectionHeaderStyles}>Auto Update</h2>
                  <DataGrid columns={2} gridColumnTemplate="35% auto">
                    <ClusterDetailRow label="OS Updates">{cluster.autoUpdate?.os}</ClusterDetailRow>
                    <ClusterDetailRow label="Kubernetes Updates">{cluster.autoUpdate?.kubernetes}</ClusterDetailRow>
                  </DataGrid>
                </Container>
              </DataGridRow>
            </DataGrid>
          </TabPanel>
          <TabPanel>
            <Container py px={false}>
              <JsonViewer expanded={2} data={cluster.raw} toolbar />
            </Container>
          </TabPanel>
        </Tabs>
      </div>
    </Container>
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
      return <Spinner size="small" aria-label="Loading cluster details" />
    }

    if (detailsError) {
      return <InlineError error={detailsError} />
    }

    if (!cluster) {
      return <span role="status">Cluster not found</span>
    }

    return <ClusterDetailContent cluster={cluster} updatedAt={updatedAt} />
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
