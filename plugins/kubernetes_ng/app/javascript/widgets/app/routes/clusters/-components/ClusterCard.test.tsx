import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClusterCard from "./ClusterCard"
import { Cluster } from "../../../types/clusters"

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

const defaultCluster: Cluster = {
  uid: "12345678-1234-1234-1234-1234567890ab",
  name: "test-cluster",
  status: "Operational",
  region: "",
  readiness: {
    status: "",
    conditions: [
      { type: "Ready", status: "True", displayValue: "Ready" },
      { type: "ControlPlaneHealthy", status: "True", displayValue: "Control Plane Healthy" },
    ],
  },
  purpose: "Testing",
  infrastructure: "AWS",
  version: "1.25.0",
  lastMaintenance: { state: "Succeeded" },
  workers: [],
  maintenance: {
    startTime: "",
    timezone: "",
    windowTime: "",
  },
  autoUpdate: { os: false, kubernetes: false },
}

describe("<ClusterCard />", () => {
  let container: HTMLElement

  it("renders cluster name", () => {
    render(<ClusterCard cluster={defaultCluster} />)
    expect(screen.getByText("test-cluster")).toBeInTheDocument()
  })

  it("displays correct status icon and color for Operational status", () => {
    const rendered = render(<ClusterCard cluster={defaultCluster} />)
    container = rendered.container
    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "success")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-accent")
  })

  it("displays correct status icon and color for Error status", () => {
    const errorCluster = { ...defaultCluster, status: "Error" }
    const rendered = render(<ClusterCard cluster={errorCluster} />)
    container = rendered.container

    const statusIcon = container.querySelector('[data-status-icon="status-icon"]')
    expect(statusIcon).toBeInTheDocument()
    expect(statusIcon).toHaveAttribute("data-icon", "dangerous")
    expect(statusIcon).toHaveAttribute("data-color", "tw-text-theme-error")
  })

  it("renders readiness conditions with correct badges when ready and CP healthy", () => {
    render(<ClusterCard cluster={defaultCluster} />)

    const badges = screen.getAllByText(/Ready|Control Plane Healthy/)
    expect(badges).toHaveLength(2)
    expect(badges[0]).toHaveTextContent("Ready")
    expect(badges[0]).toHaveClass("juno-badge-success")
    expect(badges[1]).toHaveTextContent("Control Plane Healthy")
    expect(badges[1]).toHaveClass("juno-badge-success")
  })

  it("renders readiness conditions with correct badges when not ready", () => {
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
    render(<ClusterCard cluster={errorCluster} />)

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
    render(<ClusterCard cluster={clusterWithLongId} />)

    const clusterId = screen.getByText(text)

    // Wrap click in act to flush state updates
    await act(async () => {
      fireEvent.click(clusterId)
    })

    // Clipboard should have been called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
  })

  it("renders View Details button", () => {
    render(<ClusterCard cluster={defaultCluster} />)

    const viewDetailsButton = screen.getByRole("button", { name: "View Details" })
    // TODO test the link to details as soon as implemented
    expect(viewDetailsButton).toHaveClass("juno-button-primary")
  })
})
