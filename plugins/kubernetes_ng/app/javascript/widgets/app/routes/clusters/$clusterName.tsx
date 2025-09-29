import React from "react"
import { createFileRoute, Await } from "@tanstack/react-router"
import { Cluster } from "../../types/clusters"
import { LoaderWithCrumb } from "../-types"
import {
  JsonViewer,
  Button,
  Container,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Stack,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import ClipboardText from "../../components/ClipboardText"
import RedinessConditions from "../../components/RedinessConditions"
import InlineError from "../../components/InlineError"

export const Route = createFileRoute("/clusters/$clusterName")({
  component: ClusterDetail,
  loader: async ({
    context,
    params,
  }): Promise<
    LoaderWithCrumb & {
      clusterDetailsPromise: Promise<Cluster>
      permissionsPromise: Promise<Record<string, boolean> | undefined>
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

const sectionHeaderStyles = "section tw-text-lg tw-font-bold tw-mb-4"

function ClusterDetail() {
  const { clusterDetailsPromise, permissionsPromise } = Route.useLoaderData()
  return (
    <Await
      promise={Promise.all([clusterDetailsPromise, permissionsPromise])}
      fallback={
        <Container py px={false}>
          <Spinner size="small" />
        </Container>
      }
    >
      {([cluster, permissions]) => {
        return (
          <>
            <PageHeader title={`Cluster ${cluster.name} Information`}>
              <Button size="small" label="Delete Cluster" variant="primary-danger" disabled={!permissions?.delete} />
              <Button size="small" label="Edit Cluster" disabled={!permissions?.update} />
            </PageHeader>

            {permissions?.view === false ? (
              <Container py px={false}>
                <InlineError error={new Error("You do not have permission to view cluster details.")} />
              </Container>
            ) : (
              <>
                <Tabs>
                  <TabList>
                    <Tab>Overview</Tab>
                    <Tab>JSON</Tab>
                  </TabList>
                  <TabPanel>
                    {/* Basic info */}
                    <Container py px={false}>
                      <p className={sectionHeaderStyles}>Basic information</p>
                      <DataGrid columns={2} gridColumnTemplate="50% 50%">
                        <DataGridRow>
                          <div>
                            <DataGrid columns={2} gridColumnTemplate="35% auto">
                              <DataGridRow>
                                <DataGridHeadCell>Name</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    {cluster.name}
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
                              <DataGridRow>
                                <DataGridHeadCell>ID</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    <ClipboardText text={cluster.uid} />
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
                              <DataGridRow>
                                <DataGridHeadCell>Cluster Status</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    {cluster.status}
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
                              <DataGridRow>
                                <DataGridHeadCell>Kubernetes Version</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    {cluster.version}
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
                              <DataGridRow>
                                <DataGridHeadCell>Cloud Profile</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    {cluster.cloudProfileName}
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
                            </DataGrid>
                          </div>
                          <div>
                            <DataGrid columns={2} gridColumnTemplate="35% auto">
                              <DataGridRow>
                                <DataGridHeadCell>Purpose</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    {cluster.purpose}
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
                              <DataGridRow>
                                <DataGridHeadCell>Infrastructure</DataGridHeadCell>
                                <DataGridCell>
                                  <Stack gap="1" direction="horizontal" wrap>
                                    {cluster.infrastructure}
                                  </Stack>
                                </DataGridCell>
                              </DataGridRow>
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
                            <DataGridRow key={key}>
                              <DataGridHeadCell>{key}</DataGridHeadCell>
                              <DataGridCell>
                                <Stack gap="1" direction="horizontal" wrap>
                                  {value}
                                </Stack>
                              </DataGridCell>
                            </DataGridRow>
                          ))}
                        </DataGrid>
                      ) : (
                        <p>No labels found.</p>
                      )}
                    </Container>

                    {/* Readiness Conditions */}
                    <Container py px={false}>
                      <p className={sectionHeaderStyles}>Rediness</p>
                      {cluster.readiness && cluster.readiness.conditions && cluster.readiness.conditions.length > 0 ? (
                        <DataGrid columns={2} minContentColumns={[0]}>
                          <DataGridRow>
                            <DataGridHeadCell>Rediness</DataGridHeadCell>
                            <DataGridCell>
                              <RedinessConditions conditions={cluster.readiness.conditions} />
                            </DataGridCell>
                          </DataGridRow>
                        </DataGrid>
                      ) : (
                        <p>No readiness conditions found.</p>
                      )}
                    </Container>
                  </TabPanel>
                  <TabPanel>
                    <Container py px={false}>
                      <JsonViewer expanded={2} data={cluster} toolbar />
                    </Container>
                  </TabPanel>
                </Tabs>
              </>
            )}
          </>
        )
      }}
    </Await>
  )
}
