import React from "react"
import { render, screen, within, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClusterList from "./ClusterList"
import { Cluster } from "../../../types/cluster"
import { createRoute, createRootRoute, RouterProvider, createMemoryHistory, Outlet } from "@tanstack/react-router"
import { PortalProvider } from "@cloudoperators/juno-ui-components/index"
import { getTestRouter } from "../../../mocks/getTestRouter"
import { defaultCluster } from "../../../mocks/data"

const expectClusterListHeaders = () => {
  // check the visible headers
  expect(screen.getByText("Status")).toBeInTheDocument()
  expect(screen.getByText("Name")).toBeInTheDocument()
  expect(screen.getByText("Readiness")).toBeInTheDocument()
  expect(screen.getByText("Version")).toBeInTheDocument()

  // check number of columns
  const columnHeaders = screen.getAllByRole("columnheader")
  expect(columnHeaders).toHaveLength(6)

  // check the first header contains the icon
  const icon = within(columnHeaders[0]).getByTestId("icon-monitorHeart")
  expect(icon).toBeInTheDocument()
}

const renderComponent = (clusters: Cluster[] = [defaultCluster]) => {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/clusters/",
    loader: async () =>
      Promise.resolve({
        crumb: {
          label: "Clusters",
          icon: "home",
        },
        clusters: clusters,
      }),
    component: () => (
      <PortalProvider>
        <ClusterList clusters={clusters} />
      </PortalProvider>
    ),
  })
  const routeTree = rootRoute.addChildren([testRoute])
  const router = getTestRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ["/clusters/"],
    }),
  })

  return {
    ...render(<RouterProvider router={router} />),
    router,
  }
}

describe("<ClusterList />", () => {
  it("renders the table headers if clusters are present", async () => {
    await act(async () => renderComponent())

    expectClusterListHeaders()
  })

  it("renders a ClusterListItem for each cluster", async () => {
    const clusters = [
      { ...defaultCluster, uid: "1", name: "cluster-one" },
      { ...defaultCluster, uid: "2", name: "cluster-two" },
    ]

    await act(async () => renderComponent(clusters))

    const items = screen.getAllByTestId("cluster-list-item")
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent("cluster-one")
    expect(items[1]).toHaveTextContent("cluster-two")
  })

  it("renders 'No clusters found' when the clusters array is empty with the list header", async () => {
    await act(async () => renderComponent([]))

    expectClusterListHeaders()

    expect(screen.getByText("No clusters found")).toBeInTheDocument()
    expect(screen.queryByTestId("cluster-list-item")).not.toBeInTheDocument()
  })
})
