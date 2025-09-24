import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClusterCard from "./ClusterCard"
import { Cluster } from "../../../types/clusters"
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
        <ClusterCard cluster={cluster} />
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

describe("<ClusterCard />", () => {
  let container: HTMLElement

  it("renders cluster name", async () => {
    await act(async () => renderComponent())
    expect(screen.getByText("test-cluster")).toBeInTheDocument()
  })

  it("displays correct status icon and color for Operational status", async () => {
    const rendered = await act(async () => renderComponent())
    container = rendered.container
    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "success")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-accent")
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

  it("renders readiness conditions with correct badges when ready and CP healthy", async () => {
    await act(async () => renderComponent())

    const badges = screen.getAllByText(/Ready|Control Plane Healthy/)
    expect(badges).toHaveLength(2)
    expect(badges[0]).toHaveTextContent("Ready")
    expect(badges[0]).toHaveClass("juno-badge-success")
    expect(badges[1]).toHaveTextContent("Control Plane Healthy")
    expect(badges[1]).toHaveClass("juno-badge-success")
  })

  it("renders readiness conditions with correct badges when not ready", async () => {
    const errorCluster = {
      ...defaultCluster,
      readiness: {
        status: "",
        conditions: [
          { type: "APIServerAvailable", status: "Progressing", displayValue: "API" },
          { type: "ControlPlaneHealthy", status: "Progressing", displayValue: "CP" },
          { type: "ObservabilityComponentsHealthy", status: "Progressing", displayValue: "OC" },
          { type: "EveryNodeReady", status: "Unknown", displayValue: "N" },
          { type: "SystemComponentsHealthy", status: "Unknown", displayValue: "SC" },
        ],
      },
    }
    await act(async () => renderComponent(errorCluster))

    const badges = screen.getAllByText(/API|CP|OC|N|SC/)
    expect(badges).toHaveLength(5)
    expect(badges[0]).toHaveTextContent("API")
    expect(badges[0]).toHaveClass("juno-badge-warning")
    expect(badges[1]).toHaveTextContent("CP")
    expect(badges[1]).toHaveClass("juno-badge-warning")
    expect(badges[2]).toHaveTextContent("OC")
    expect(badges[2]).toHaveClass("juno-badge-warning")
    expect(badges[3]).toHaveTextContent("N")
    expect(badges[3]).toHaveClass("juno-badge-warning")
    expect(badges[4]).toHaveTextContent("SC")
    expect(badges[4]).toHaveClass("juno-badge-warning")
  })

  it("copies cluster ID to clipboard when ID is clicked", async () => {
    const text = "12345678-1234-1234-1234-1234567890ab"
    const clusterWithLongId = { ...defaultCluster, uid: text }
    await act(async () => renderComponent(clusterWithLongId))

    const clusterId = screen.getByText(text)

    // Wrap click in act to flush state updates
    await act(async () => {
      fireEvent.click(clusterId)
    })

    // Clipboard should have been called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
  })

  it("renders View Details button", async () => {
    await act(async () => renderComponent())

    const viewDetailsButton = screen.getByRole("button", { name: "View Details" })
    // TODO test the link to details as soon as implemented
    expect(viewDetailsButton).toHaveClass("juno-button-primary")
  })
})
