import React, { useState } from "react"
import { createFileRoute, useLoaderData } from "@tanstack/react-router"
import {
  JsonViewer,
  Container,
  ContentHeading,
  Grid,
  GridRow,
  Stack,
  PopupMenu,
  PopupMenuOptions,
  PopupMenuItem,
  Modal,
  Button,
} from "@cloudoperators/juno-ui-components"
import ClusterCard from "./-components/ClusterCard"
import { Cluster } from "../../types/clusters"
import { LoaderWithCrumb } from "../-types"

// TODO check hack styles with design colleagues
const popupMenuStyles = `
    juno-button
    juno-button-default
    juno-button-small-size
    jn-font-bold
    jn-inline-flex
    jn-justify-center
    jn-items-center
    jn-rounded
    jn-py-[0.3125rem]
    jn-px-[0.5rem]`

export const Route = createFileRoute("/clusters/")({
  component: Index,
  loader: async ({ context }): Promise<LoaderWithCrumb & { clusters: Cluster[] }> => {
    const client = context.apiClient
    const clusters = await client
      ?.get<{ data: Cluster[] }>("/kubernetes-ng/api/clusters/")
      .then((response) => response.data)
    return {
      crumb: {
        label: "Clusters",
        icon: "home",
      },
      clusters: clusters || [],
    }
  },
})

function Index() {
  const [displayJson, setDisplayJson] = useState(false)
  const { clusters } = useLoaderData({ from: Route.id })

  return (
    <>
      <Container py px={false}>
        <Stack>
          <ContentHeading className="tw-w-full">Kubernetes Clusters</ContentHeading>
          {/* global actions */}
          <Stack gap="2" className="tw-whitespace-nowrap" distribution="center">
            <Button size="small" label="Add Cluster" />
            {/* <Button size="small"> */}
            <PopupMenu className={popupMenuStyles}>
              <PopupMenuOptions>
                <div onClick={() => setDisplayJson(true)}>
                  <PopupMenuItem label="JSON" />
                </div>
              </PopupMenuOptions>
            </PopupMenu>
            {/* </Button> */}
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
        <JsonViewer expanded={true} data={clusters || []} />
      </Modal>
    </>
  )
}

export default Index
