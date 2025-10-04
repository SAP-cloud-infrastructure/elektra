import React from "react"
import { render, screen, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClusterListItem from "./ClusterListItem"
import { Cluster } from "../../../types/cluster"
import { createRoute, createRootRoute, RouterProvider, createMemoryHistory, Outlet } from "@tanstack/react-router"
import { PortalProvider } from "@cloudoperators/juno-ui-components/index"
import { getTestRouter } from "../../../mocks/getTestRouter"
import { defaultCluster } from "../../../mocks/data"

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

const renderComponent = (cluster: Cluster = defaultCluster) => {
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
        clusters: [cluster],
      }),
    component: () => (
      <PortalProvider>
        <ClusterListItem cluster={cluster} />
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

describe("<ClusterListItem />", () => {
  let container: HTMLElement

  it("displays correct status icon and color for Operational status", async () => {
    const rendered = await act(async () => renderComponent())
    container = rendered.container
    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "checkCircle")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-success")
  })

  it("displays correct status icon and color for Error status", async () => {
    const errorCluster = { ...defaultCluster, status: "Error" }
    const rendered = await act(async () => renderComponent(errorCluster))
    container = rendered.container

    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "dangerous")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-error")
  })

  it("renders readiness conditions", async () => {
    await act(async () => renderComponent())
    expect(screen.getByTestId("readiness-conditions")).toBeInTheDocument()
  })

  it("copies cluster ID to clipboard", async () => {
    await act(async () => renderComponent())
    const clipboardButton = screen.getByTestId("clipboard-text")
    expect(clipboardButton).toHaveTextContent(defaultCluster.uid)
    expect(clipboardButton).toBeInTheDocument()
  })

  it("renders View Details button with correct link", async () => {
    const clusterWithName = { ...defaultCluster, name: "test-cluster-123" }
    await act(async () => renderComponent(clusterWithName))

    const viewDetailsButton = screen.getByRole("button", { name: "View Details" })
    const link = viewDetailsButton.closest("a")
    expect(link).toHaveAttribute("href", `/clusters/${clusterWithName.name}`)
    expect(viewDetailsButton).toHaveClass("juno-button-primary")
  })
})
