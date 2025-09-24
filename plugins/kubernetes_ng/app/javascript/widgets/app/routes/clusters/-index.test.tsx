import React from "react"
import { render, screen, act } from "@testing-library/react"
import { createRoute, createRootRoute, RouterProvider, createMemoryHistory, Outlet } from "@tanstack/react-router"
import Index from "./index"
import { PortalProvider } from "@cloudoperators/juno-ui-components/index"
import { getTestRouter } from "../../mocks/getTestRouter"
import { defaultCluster } from "../../mocks/data"
import { Breadcrumb } from "../../components/Breadcrumb"

const renderComponent = () => {
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
        clustersPromise: Promise.resolve([defaultCluster]),
      }),
    component: () => (
      <PortalProvider>
        <Breadcrumb data-breadcrumb="main" />
        <Index />
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

describe("<Index />", () => {
  it("renders heading and description", async () => {
    await act(async () => renderComponent())

    expect(screen.getByText("Kubernetes Clusters")).toBeInTheDocument()
    expect(screen.getByText("Manage your VM-based Kubernetes deployments")).toBeInTheDocument()
  })

  it("renders main buttons", async () => {
    await act(async () => renderComponent())

    const addClusterButton = screen.getByRole("button", { name: "Add Cluster" })
    // TODO test the link to add cluster as soon as implemented
    expect(addClusterButton).toHaveClass("juno-button-default")
  })

  it("renders cluster cards", async () => {
    await act(async () => renderComponent())

    const cards = document.querySelectorAll('[data-card="cluster-card"]')
    expect(cards.length).toBe(1)
    expect(cards[0]).toBeInTheDocument()
  })

  it("renders breadcrumb", async () => {
    await act(async () => renderComponent())

    const breadcrumb = document.querySelector('[data-breadcrumb="main"]')
    expect(breadcrumb).toBeInTheDocument()
    expect(breadcrumb).toHaveTextContent("Clusters")
  })
})
