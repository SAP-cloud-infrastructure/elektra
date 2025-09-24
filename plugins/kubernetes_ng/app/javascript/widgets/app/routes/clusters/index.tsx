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
import PopupMenu from "../../components/PopupMenu"
import InlineError from "../../components/InlineError"

export const Route = createFileRoute("/clusters/")({
  component: Index,
  loader: async ({ context }) => {
    const client = context.apiClient
    const clustersPromise = client.gardener.getClusters()
    const permissionsPromise = client.gardener.getPermissions()

    return {
      clustersPromise,
      permissionsPromise,
    }
  },
})

function Index() {
  const [displayJson, setDisplayJson] = useState(false)
  const { clustersPromise, permissionsPromise } = useLoaderData({ from: Route.id })

  return (
    <Container py px={false}>
      <Stack>
        <ContentHeading className="tw-w-full">Kubernetes Clusters</ContentHeading>
        <Await promise={Promise.all([clustersPromise, permissionsPromise])} fallback={<></>}>
          {([_, permissions]) => {
            return (
              <Stack gap="2" className="tw-whitespace-nowrap" distribution="center">
                <Button size="small" label="Add Cluster" disabled={!permissions?.create} />
                <PopupMenu>
                  <div onClick={() => setDisplayJson(true)}>
                    <PopupMenuItem label="JSON" />
                  </div>
                </PopupMenu>
              </Stack>
            )
          }}
        </Await>
      </Stack>
      <p>Manage your VM-based Kubernetes deployments</p>

      <Await
        promise={Promise.all([clustersPromise, permissionsPromise])}
        fallback={
          <Container py px={false}>
            <Spinner size="small" />
          </Container>
        }
      >
        {([clusters, permissions]) => {
          return (
            <>
              {permissions?.list === false ? (
                <Container py px={false}>
                  <InlineError error={new Error("You do not have permission to view clusters.")} />
                </Container>
              ) : (
                <>
                  {clusters && clusters.length === 0 ? (
                    <p>No clusters found.</p>
                  ) : (
                    <Container py px={false}>
                      <Grid>
                        <GridRow>
                          {clusters?.map((cluster) => <ClusterCard key={cluster.uid} cluster={cluster} />)}
                        </GridRow>
                      </Grid>
                    </Container>
                  )}
                  <Modal size="large" onCancel={() => setDisplayJson(false)} open={displayJson}>
                    <JsonViewer expanded={2} data={clusters || []} />
                  </Modal>
                </>
              )}
            </>
          )
        }}
      </Await>
    </Container>
  )
}

export default Index
