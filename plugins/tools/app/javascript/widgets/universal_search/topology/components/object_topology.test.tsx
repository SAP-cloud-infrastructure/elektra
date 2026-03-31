import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ObjectTopology from "./object_topology"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("./graph", () => ({
  Graph: ({ nodes, links, showDetails }: any) => (
    <div
      data-testid="graph"
      data-nodes={JSON.stringify(nodes)}
      data-links={JSON.stringify(links)}
      onClick={() => showDetails({ offsetX: 10, offsetY: 20 }, nodes[0])}
    />
  ),
}))

vi.mock("@cloudoperators/juno-ui-components", () => ({
  JsonViewer: ({ data }: any) => <div data-testid="json-viewer">{JSON.stringify(data)}</div>,
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockObjects = {
  "obj-1": {
    id: "obj-1",
    name: "server-1",
    cached_object_type: "server",
    children: ["obj-2"],
    isFetching: false,
    payload: { foo: "bar" },
  },
  "obj-2": {
    id: "obj-2",
    name: "network-1",
    cached_object_type: "network",
    children: [],
    isFetching: false,
    payload: { baz: "qux" },
  },
}

const defaultProps = {
  objectId: "root-1",
  objects: mockObjects,
  loadRelatedObjects: vi.fn(),
  removeRelatedObjects: vi.fn(),
  resetState: vi.fn(),
  showFilter: true,
}

const renderComponent = (props = {}) =>
  render(<ObjectTopology {...defaultProps} {...props} />)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ObjectTopology", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Mount / unmount ────────────────────────────────────────────────────────

  describe("Mount / unmount", () => {
    it("calls loadRelatedObjects with objectId on mount", () => {
      renderComponent()
      expect(defaultProps.loadRelatedObjects).toHaveBeenCalledWith("root-1")
    })

    it("calls resetState on unmount", () => {
      const { unmount } = renderComponent()
      unmount()
      expect(defaultProps.resetState).toHaveBeenCalled()
    })

    it("re-calls loadRelatedObjects when objectId changes", () => {
      const { rerender } = renderComponent()
      rerender(<ObjectTopology {...defaultProps} objectId="root-2" />)
      expect(defaultProps.loadRelatedObjects).toHaveBeenCalledWith("root-2")
    })
  })

  // ── Initial selected types ─────────────────────────────────────────────────

  describe("Initial selected types", () => {
    it("initialises selectedTypes from objects when objects are present on mount", () => {
      renderComponent()
      // Both object types should appear as filter options that are checked
      const links = screen.getAllByRole("link")
      const labels = links.map((l) => l.textContent)
      expect(labels).toContain("server")
      expect(labels).toContain("network")
    })

    it("initialises selectedTypes when objects arrive via props after mount", () => {
      const { rerender } = renderComponent({ objects: undefined })
      // no types yet
      expect(screen.queryByRole("link")).not.toBeInTheDocument()

      rerender(<ObjectTopology {...defaultProps} objects={mockObjects} />)
      const links = screen.getAllByRole("link")
      const labels = links.map((l) => l.textContent)
      expect(labels).toContain("server")
      expect(labels).toContain("network")
    })

    it("does not re-initialise selectedTypes once they are already set", () => {
      const { rerender } = renderComponent()
      // Open dropdown and uncheck 'server'
      fireEvent.click(screen.getByText("Select ..."))
      const serverLink = screen.getAllByRole("link").find((l) => l.textContent === "server")!
      fireEvent.click(serverLink)

      // Re-render with new objects — selectedTypes should NOT be reset
      const newObjects = {
        ...mockObjects,
        "obj-3": { id: "obj-3", name: "router-1", cached_object_type: "router", children: [], isFetching: false, payload: {} },
      }
      rerender(<ObjectTopology {...defaultProps} objects={newObjects} />)

      // 'server' was unchecked and should stay unchecked (fa-square-o icon)
      fireEvent.click(screen.getByText("Select ..."))
      const serverIcon = screen
        .getAllByRole("link")
        .find((l) => l.textContent === "server")!
        .querySelector("i")
      expect(serverIcon).toHaveClass("fa-square-o")
    })
  })

  // ── Filter dropdown ────────────────────────────────────────────────────────

  describe("Filter dropdown", () => {
    it("renders the filter toolbar when showFilter is true", () => {
      renderComponent()
      expect(screen.getByText("Select ...")).toBeInTheDocument()
    })

    it("dropdown is collapsed by default", () => {
      renderComponent()
      const dropdown = document.querySelector(".dropdown")
      expect(dropdown).not.toHaveClass("open")
    })

    it("opens dropdown when Select button is clicked", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      expect(document.querySelector(".dropdown")).toHaveClass("open")
    })

    it("closes dropdown when Select button is clicked again", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      fireEvent.click(screen.getByText("Select ..."))
      expect(document.querySelector(".dropdown")).not.toHaveClass("open")
    })

    it("renders one option per unique object type", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      const links = screen.getAllByRole("link")
      expect(links).toHaveLength(2) // server + network
    })

    it("toggles a type off when its option is clicked", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      const serverLink = screen.getAllByRole("link").find((l) => l.textContent === "server")!
      fireEvent.click(serverLink)
      const icon = serverLink.querySelector("i")
      expect(icon).toHaveClass("fa-square-o")
      expect(icon).not.toHaveClass("fa-check-square-o")
    })

    it("toggles a type back on when its option is clicked again", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      const serverLink = screen.getAllByRole("link").find((l) => l.textContent === "server")!
      fireEvent.click(serverLink) // off
      fireEvent.click(serverLink) // on
      const icon = serverLink.querySelector("i")
      expect(icon).toHaveClass("fa-check-square-o")
    })
  })

  // ── Graph rendering ────────────────────────────────────────────────────────

  describe("Graph rendering", () => {
    it("renders the Graph component", () => {
      renderComponent()
      expect(screen.getByTestId("graph")).toBeInTheDocument()
    })

    it("passes only nodes of selected types to Graph", () => {
      renderComponent()
      const graphEl = screen.getByTestId("graph")
      const nodes = JSON.parse(graphEl.getAttribute("data-nodes") || "[]")
      // Both types selected by default — both nodes visible
      expect(nodes).toHaveLength(2)
    })

    it("excludes nodes of deselected types from Graph", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      const serverLink = screen.getAllByRole("link").find((l) => l.textContent === "server")!
      fireEvent.click(serverLink) // deselect server

      const nodes = JSON.parse(screen.getByTestId("graph").getAttribute("data-nodes") || "[]")
      expect(nodes.every((n: any) => n.cached_object_type !== "server")).toBe(true)
    })

    it("passes links only between visible nodes to Graph", () => {
      renderComponent()
      fireEvent.click(screen.getByText("Select ..."))
      const serverLink = screen.getAllByRole("link").find((l) => l.textContent === "server")!
      fireEvent.click(serverLink) // deselect server — link between obj-1 and obj-2 should disappear

      const links = JSON.parse(screen.getByTestId("graph").getAttribute("data-links") || "[]")
      expect(links).toHaveLength(0)
    })

    it("renders no graph when objects is undefined", () => {
      renderComponent({ objects: undefined })
      const nodes = JSON.parse(screen.getByTestId("graph").getAttribute("data-nodes") || "[]")
      expect(nodes).toHaveLength(0)
    })
  })

  // ── Details popover ────────────────────────────────────────────────────────

  describe("Details popover", () => {
    it("shows details popover when showDetails is called", () => {
      renderComponent()
      fireEvent.click(screen.getByTestId("graph"))
      expect(screen.getByText(/Details for server server-1/)).toBeInTheDocument()
    })

    it("renders JsonViewer with node payload in popover", () => {
      renderComponent()
      fireEvent.click(screen.getByTestId("graph"))
      expect(screen.getByTestId("json-viewer")).toBeInTheDocument()
    })

    it("closes the popover when the close button is clicked", () => {
      renderComponent()
      fireEvent.click(screen.getByTestId("graph"))
      expect(screen.getByText(/Details for server server-1/)).toBeInTheDocument()
      fireEvent.click(screen.getByLabelText("Close"))
      expect(screen.queryByText(/Details for server/)).not.toBeInTheDocument()
    })
  })
})
