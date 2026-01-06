import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import DetailsContent from "./DetailsContent"
import { defaultCluster } from "../../../../mocks/data"

describe("DetailsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders basic info and updatedAt", async () => {
    const updatedAt = Date.now()
    render(<DetailsContent cluster={defaultCluster} updatedAt={updatedAt} />)

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    expect(screen.getByText(defaultCluster.name)).toBeInTheDocument()
    expect(screen.getByText(defaultCluster.uid)).toBeInTheDocument()
    expect(screen.getByText(defaultCluster.status)).toBeInTheDocument()
  })

  it("renders readiness conditions if present", () => {
    render(<DetailsContent cluster={defaultCluster} />)

    // Find the Readiness heading
    const readinessSection = screen.getByRole("heading", { name: /Readiness/i, level: 2 })
    expect(readinessSection).toBeInTheDocument()

    // Scope queries to the container under the heading
    const sectionContainer = readinessSection.parentElement!
    const { getByRole } = within(sectionContainer)

    // Find a columnheader role whose accessible name includes "Readiness"
    const readinessHeader = getByRole("columnheader", { name: /Readiness/i })
    expect(readinessHeader).toBeInTheDocument()
  })

  it("renders fallback text when readiness conditions are missing", () => {
    const cluster = {
      ...defaultCluster,
      readiness: {
        status: "",
        conditions: [],
      },
    }
    render(<DetailsContent cluster={cluster} />)
    expect(screen.getByText(/No readiness conditions found/i)).toBeInTheDocument()
  })

  it("renders last errors if present", () => {
    render(<DetailsContent cluster={defaultCluster} />)

    // Find the heading
    const lastErrorsSection = screen.getByRole("heading", { name: /Latest Operation & Errors/i, level: 2 })
    expect(lastErrorsSection).toBeInTheDocument()

    // Scope queries to the container under the heading
    const sectionContainer = lastErrorsSection.parentElement!
    const { getByRole } = within(sectionContainer)

    // Find a columnheader role whose accessible name includes "Latest Operation & Errors"
    const errorsHeader = getByRole("columnheader", { name: /Errors/i })
    expect(errorsHeader).toBeInTheDocument()
  })

  it("toggles last operation details when clicking button", () => {
    render(<DetailsContent cluster={defaultCluster} />)
    const toggleBtn = screen.getByRole("button", { name: /Show last operation/i })
    fireEvent.click(toggleBtn)
    expect(screen.getByText(defaultCluster!.lastOperation!.description!)).toBeInTheDocument()
  })

  it("renders WorkerList", () => {
    render(<DetailsContent cluster={defaultCluster} />)

    // Find the heading
    const workerGroupsSection = screen.getByRole("heading", { name: /Worker Groups/i, level: 2 })
    expect(workerGroupsSection).toBeInTheDocument()

    // Scope queries to the container under the heading
    const sectionContainer = workerGroupsSection.parentElement!
    const { getByRole } = within(sectionContainer)

    // Find a grid role
    const workersGrid = getByRole("grid")
    expect(workersGrid).toBeInTheDocument()
  })

  it("renders maintenance and auto-update sections", () => {
    render(<DetailsContent cluster={defaultCluster} />)

    // Find the heading
    const maintenanceWindowSection = screen.getByRole("heading", { name: /Maintenance Window/i, level: 2 })
    expect(maintenanceWindowSection).toBeInTheDocument()

    const sectionContainer = maintenanceWindowSection.parentElement!
    const { getByRole } = within(sectionContainer)

    // Find a grid role
    const maintenanceGrid = getByRole("grid")
    expect(maintenanceGrid).toBeInTheDocument()
  })

  it("switches to JSON tab and renders JsonViewer", async () => {
    render(<DetailsContent cluster={defaultCluster} />)
    const jsonTab = screen.getByText("JSON")
    fireEvent.click(jsonTab)

    // Expect JsonViewer to be in the document
    const someKey = Object.keys(defaultCluster.raw)[0]
    const jsonViewer = await screen.findByText(new RegExp(someKey, "i"))
    expect(jsonViewer).toBeInTheDocument()
  })
})
