import React from "react"
import { screen, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClusterListItem from "./ClusterListItem"
import { renderComponent } from "../../../mocks/TestTools"
import { defaultCluster } from "../../../mocks/data"

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

describe("<ClusterListItem />", () => {
  let container: HTMLElement

  it("displays correct status icon and color for healthy, progressing, unhealthy, and unknown statuses", async () => {
    const operationalCluster = { ...defaultCluster, status: "healthy" }
    const rendered = await act(async () => renderComponent(<ClusterListItem cluster={operationalCluster} />))
    container = rendered.container

    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "checkCircle")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-success")

    const runningCluster = { ...defaultCluster, status: "progressing" }
    const renderedRunning = await act(async () => renderComponent(<ClusterListItem cluster={runningCluster} />))
    container = renderedRunning.container

    const runningStatusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(runningStatusIcon).toBeInTheDocument()
    expect(runningStatusIcon).toHaveAttribute("data-icon", "warning")
    expect(runningStatusIcon).toHaveAttribute("data-color", "tw-text-theme-warning")

    const unhealthyCluster = { ...defaultCluster, status: "unhealthy" }
    const renderedUnhealthy = await act(async () => renderComponent(<ClusterListItem cluster={unhealthyCluster} />))
    container = renderedUnhealthy.container

    const unhealthyStatusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(unhealthyStatusIcon).toBeInTheDocument()
    expect(unhealthyStatusIcon).toHaveAttribute("data-icon", "dangerous")
    expect(unhealthyStatusIcon).toHaveAttribute("data-color", "tw-text-theme-error")

    const unknownCluster = { ...defaultCluster, status: "unknown" }
    const renderedUnknown = await act(async () => renderComponent(<ClusterListItem cluster={unknownCluster} />))
    container = renderedUnknown.container

    const unknownStatusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(unknownStatusIcon).toBeInTheDocument()
    expect(unknownStatusIcon).toHaveAttribute("data-icon", "help")
    expect(unknownStatusIcon).toHaveAttribute("data-color", "tw-text-theme-warning")
  })

  it("displays correct status icon and color for deleted status", async () => {
    const deletedCluster = { ...defaultCluster, isDeleted: true }
    const rendered = await act(async () => renderComponent(<ClusterListItem cluster={deletedCluster} />))
    container = rendered.container

    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "checkCircle")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-light")
  })

  it("renders readiness conditions", async () => {
    await act(async () => renderComponent(<ClusterListItem cluster={defaultCluster} />))

    defaultCluster.readiness.conditions.forEach((condition) => {
      expect(screen.getByText(condition.displayValue)).toBeInTheDocument()
    })
  })

  it("renders View Details button with correct link", async () => {
    const clusterWithName = { ...defaultCluster, name: "test-cluster-123" }
    await act(async () => renderComponent(<ClusterListItem cluster={clusterWithName} />))

    const viewDetailsButton = screen.getByRole("button", { name: "View Details" })
    const link = viewDetailsButton.closest("a")
    expect(link).toHaveAttribute("href", `/clusters/${clusterWithName.name}`)
    expect(viewDetailsButton).toHaveClass("juno-button-primary")
  })
})
