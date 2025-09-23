import React, { useState } from "react"
import { createFileRoute, Await } from "@tanstack/react-router"
import { Cluster } from "../../types/clusters"
import { LoaderWithCrumb } from "../-types"
import {
  JsonViewer,
  PopupMenuItem,
  Modal,
  Button,
  Container,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
  Stack,
  Spinner,
} from "@cloudoperators/juno-ui-components"
import PageHeader from "../../components/PageHeader"
import CustomPopupMenu from "../../components/PopupMenu"
import ClipboardText from "../../components/ClipboardText"
import RedinessConditions from "../../components/RedinessConditions"

export const Route = createFileRoute("/clusters/$clusterName")({
  component: ClusterDetail,
  loader: async ({ context, params }): Promise<LoaderWithCrumb & { clusterDetailsPromise: Promise<Cluster> }> => {
    const client = context.apiClient
    const clusterDetailsPromise = client
      ?.get<{ data: Cluster }>(`/kubernetes-ng/api/clusters/${params.clusterName}/`)
      .then((response) => response.data)

    // const permissions = await context.trpcClient?.gardener.getPermissions.query()

    return {
      crumb: {
        label: `${params.clusterName}`,
      },
      clusterDetailsPromise,
    }
  },
})

const sectionHeaderStyles = "section tw-text-lg tw-font-bold tw-mb-4"

function ClusterDetail() {
  const { clusterDetailsPromise } = Route.useLoaderData()
  const [displayJson, setDisplayJson] = useState(false)
  return (
    <Await
      promise={clusterDetailsPromise}
      fallback={
        <Container py px={false}>
          <Spinner size="small" />
        </Container>
      }
    >
      {(cluster) => {
        return (
          <>
            <PageHeader title={`Cluster ${cluster.name} Information`}>
              <Button size="small" label="Delete Cluster" variant="primary-danger" />
              <Button size="small" label="Edit Cluster" />
              <CustomPopupMenu>
                <div onClick={() => setDisplayJson(true)}>
                  <PopupMenuItem label="JSON" />
                </div>
              </CustomPopupMenu>
            </PageHeader>

            {/* Basic info */}
            <Container py px={false}>
              <p className={sectionHeaderStyles}>Basic information</p>
              <DataGrid columns={2} gridColumnTemplate="50% 50%">
                <DataGridRow>
                  <div>
                    <DataGrid columns={2} gridColumnTemplate="40% auto">
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
                            <ClipboardText text={cluster.uid} className="tw-ml-2" />
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
                    <DataGrid columns={2}>
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

            {/* JSON Modal */}
            <Modal size="large" onCancel={() => setDisplayJson(false)} open={displayJson}>
              <JsonViewer expanded={2} data={cluster} toolbar />
            </Modal>
          </>
        )
      }}
    </Await>
  )
}
