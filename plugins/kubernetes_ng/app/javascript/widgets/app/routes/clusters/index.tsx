import React from "react"
import { createFileRoute, useLoaderData, Await } from "@tanstack/react-router"
import { Container, ContentHeading, Stack, Button, Spinner } from "@cloudoperators/juno-ui-components"
import InlineError from "../../components/InlineError"
import ClusterList from "./-components/ClusterList"

export const Route = createFileRoute("/clusters/")({
  component: Clusters,
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

function Clusters() {
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
                <Container py px={false}>
                  <ClusterList clusters={clusters} />
                </Container>
              )}
            </>
          )
        }}
      </Await>
    </Container>
  )
}

export default Clusters
