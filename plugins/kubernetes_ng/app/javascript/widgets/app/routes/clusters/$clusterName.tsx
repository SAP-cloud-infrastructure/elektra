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
  DataGridHeadCell,
  DataGridCell,
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

function ClusterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DataGridRow>
      <DataGridHeadCell>{label}</DataGridHeadCell>
      <DataGridCell>{children}</DataGridCell>
    </DataGridRow>
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
                                <ClusterField label="Name">{cluster.name}</ClusterField>
                                <ClusterField label="ID">
                                  <ClipboardText text={cluster.uid} />
                                </ClusterField>
                                <ClusterField label="Cluster Status">{cluster.status}</ClusterField>
                                <ClusterField label="Kubernetes Version">{cluster.version}</ClusterField>
                                <ClusterField label="Cloud Profile">{cluster.cloudProfileName}</ClusterField>
                              </DataGrid>
                            </div>
                            <div>
                              <DataGrid columns={2} gridColumnTemplate="35% auto">
                                <ClusterField label="Purpose">{cluster.purpose}</ClusterField>
                                <ClusterField label="Infrastructure">{cluster.infrastructure}</ClusterField>
                              </DataGrid>
                            </div>
                          </DataGridRow>
                        </DataGrid>
                      </Container>

                      {/* Cluster Labels */}
                      <Container py px={false}>
                        <p className={sectionHeaderStyles}>Labels</p>
                        {cluster.labels && Object.keys(cluster.labels).length > 0 ? (
                          <DataGrid columns={2} minContentColumns={[0]}>
                            {Object.entries(cluster.labels).map(([key, value]) => (
                              <ClusterField key={key} label={key}>
                                {value}
                              </ClusterField>
                            ))}
                          </DataGrid>
                        ) : (
                          <p>No labels found.</p>
                        )}
                      </Container>

                      {/* Readiness Conditions */}
                      <Container py px={false}>
                        <p className={sectionHeaderStyles}>Readiness</p>
                        {cluster?.readiness?.conditions?.length > 0 ? (
                          <DataGrid columns={2} minContentColumns={[0]}>
                            <ClusterField label="Readiness">
                              <ReadinessConditions conditions={cluster?.readiness?.conditions} />
                            </ClusterField>
                          </DataGrid>
                        ) : (
                          <p>No readiness conditions found.</p>
                        )}
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
