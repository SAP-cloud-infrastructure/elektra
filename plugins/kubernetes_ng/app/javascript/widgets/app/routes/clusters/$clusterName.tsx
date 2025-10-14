import React from "react"
import { createFileRoute, Await, CatchBoundary, useParams } from "@tanstack/react-router"
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

const ROUTE_ID = "/clusters/$clusterName"

export const Route = createFileRoute(ROUTE_ID)({
  component: ClusterDetail,
  loader: async ({
    context,
    params,
  }): Promise<
    LoaderWithCrumb & {
      clusterDetailsPromise: Promise<Cluster>
      permissionsPromise: Promise<Permissions>
    }
  > => {
    const client = context.apiClient
    const clusterDetailsPromise = client.gardener.getClusterByName(params.clusterName)
    const permissionsPromise = client.gardener.getPermissions()

    return {
      crumb: {
        label: `${params.clusterName}`,
      },
      clusterDetailsPromise,
      permissionsPromise,
    }
  },
})

function ClusterDetailActions({ permissions, disabled = false }: { permissions?: Permissions; disabled?: boolean }) {
  return (
    <>
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

function ClusterDetail() {
  const { clusterDetailsPromise, permissionsPromise } = Route.useLoaderData()
  const params = useParams({ from: ROUTE_ID })
  const combinedPromise = Promise.all([clusterDetailsPromise, permissionsPromise])

  return (
    <>
      <PageHeader title={`Cluster ${params.clusterName} Information`}>
        <CatchBoundary getResetKey={() => "reset"} errorComponent={() => <ClusterDetailActions disabled />}>
          <Await promise={combinedPromise} fallback={<ClusterDetailActions disabled />}>
            {([_, permissions]) => <ClusterDetailActions permissions={permissions} />}
          </Await>
        </CatchBoundary>
      </PageHeader>

      <CatchBoundary getResetKey={() => "reset"} errorComponent={({ error }) => <InlineError error={error} />}>
        <Await promise={combinedPromise} fallback={<Spinner size="small" data-testid="loading-state" />}>
          {([cluster, permissions]) => {
            return (
              <>
                {permissions?.get === false ? (
                  <InlineError error={new Error("You do not have permission to view cluster details.")} />
                ) : (
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
                              <ClusterDetailRow label="Kubernetes Updates">
                                {cluster.autoUpdate?.kubernetes}
                              </ClusterDetailRow>
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
                        <JsonViewer expanded={2} data={cluster} toolbar data-testid="json-viewer" />
                      </Container>
                    </TabPanel>
                  </Tabs>
                )}
              </>
            )
          }}
        </Await>
      </CatchBoundary>
    </>
  )
}

export default ClusterDetail
