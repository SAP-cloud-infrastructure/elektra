import React, { useState } from "react"
import { createFileRoute, useLoaderData, Await } from "@tanstack/react-router"
import {
  JsonViewer,
  Container,
  ContentHeading,
  Grid,
  GridRow,
  Stack,
  PopupMenuItem,
  Modal,
  Button,
  Spinner,
} from "@cloudoperators/juno-ui-components"
import ClusterCard from "./-components/ClusterCard"
import { Cluster } from "../../types/clusters"
import PopupMenu from "../../components/PopupMenu"

export const Route = createFileRoute("/clusters/")({
  component: Index,
  loader: async ({ context }) => {
    const client = context.apiClient
    const clustersPromise = client
      .get<{ data: Cluster[] }>("/kubernetes-ng/api/clusters/")
      .then((response) => response.data)
    return {
      clustersPromise,
    }
  },
})

function Index() {
  const [displayJson, setDisplayJson] = useState(false)
  const { clustersPromise } = useLoaderData({ from: Route.id })

  return (
    <Await
      promise={clustersPromise}
      fallback={
        <Container py px={false}>
          <Spinner size="small" />
        </Container>
      }
    >
      {(clusters) => {
        return (
          <>
            <Container py px={false}>
              <Stack>
                <ContentHeading className="tw-w-full">Kubernetes Clusters</ContentHeading>
                {/* overview actions  */}
                <Stack gap="2" className="tw-whitespace-nowrap" distribution="center">
                  <Button size="small" label="Add Cluster" />
                  <PopupMenu>
                    <div onClick={() => setDisplayJson(true)}>
                      <PopupMenuItem label="JSON" />
                    </div>
                  </PopupMenu>
                </Stack>
              </Stack>
              <p>Manage your VM-based Kubernetes deployments</p>
            </Container>
            {clusters && clusters.length === 0 ? (
              <Container py px={false}>
                No clusters found.
              </Container>
            ) : (
              <Container py px={false}>
                <Grid>
                  <GridRow>{clusters?.map((cluster) => <ClusterCard key={cluster.uid} cluster={cluster} />)}</GridRow>
                </Grid>
              </Container>
            )}
            <Modal size="large" onCancel={() => setDisplayJson(false)} open={displayJson}>
              <JsonViewer expanded={2} data={clusters || []} />
            </Modal>
          </>
        )
      }}
    </Await>
  )
}

export default Index
