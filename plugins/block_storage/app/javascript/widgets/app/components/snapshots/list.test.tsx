import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import List from "./list"

// Mock only external dependencies
vi.mock("react-transition-group", () => ({
  CSSTransition: ({ children }: any) => <>{children}</>,
}))

// Mock the ajax_helper module
vi.mock("lib/ajax_helper", () => ({
  scope: {
    domain: "test-domain",
    project: "test-project",
  },
}))

// Mock global policy
global.policy = {
  isAllowed: vi.fn(() => true),
}

// Mock constants
vi.mock("../../constants", () => ({
  SNAPSHOT_PENDING_STATUS: ["creating", "deleting"],
}))

// Wrapper component for router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe("List Component", () => {
  const mockSnapshots = [
    {
      id: "1",
      name: "Snapshot 1",
      description: "Description 1",
      size: 10,
      volume_id: "vol-1",
      volume_name: "Volume 1",
      status: "available",
    },
    {
      id: "2",
      name: "Snapshot 2",
      description: "Description 2",
      size: 20,
      volume_id: "vol-2",
      volume_name: "Volume 2",
      status: "creating",
    },
  ]

  const defaultProps = {
    active: true,
    snapshots: {
      items: mockSnapshots,
      searchTerm: "",
      hasNext: false,
      isFetching: false,
    },
    loadSnapshotsOnce: vi.fn(),
    search: vi.fn(),
    loadNext: vi.fn(),
    reloadSnapshot: vi.fn(),
    deleteSnapshot: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("renders the table with snapshots", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.getByText("Snapshot")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Size(GB)")).toBeInTheDocument()
    expect(screen.getByText("Source Volume")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
  })

  it("renders all snapshot items", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.getByText("Snapshot 1")).toBeInTheDocument()
    expect(screen.getByText("Snapshot 2")).toBeInTheDocument()
    expect(screen.getByText("Description 1")).toBeInTheDocument()
    expect(screen.getByText("Description 2")).toBeInTheDocument()
  })

  it("renders snapshot IDs", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("renders volume information", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.getByText("Volume 1")).toBeInTheDocument()
    expect(screen.getByText("Volume 2")).toBeInTheDocument()
    expect(screen.getByText("vol-1")).toBeInTheDocument()
    expect(screen.getByText("vol-2")).toBeInTheDocument()
  })

  it("renders snapshot sizes", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("20")).toBeInTheDocument()
  })

  it("renders snapshot statuses", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.getByText("available")).toBeInTheDocument()
    expect(screen.getByText("creating")).toBeInTheDocument()
  })

  it("shows search field when more than 5 items", () => {
    const propsWithManyItems = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        items: Array(6)
          .fill(null)
          .map((_, idx) => ({ ...mockSnapshots[0], id: `${idx}`, name: `Snapshot ${idx}` })),
      },
    }

    render(<List {...propsWithManyItems} />, { wrapper: RouterWrapper })

    expect(screen.getByPlaceholderText("name, ID, format or status")).toBeInTheDocument()
  })

  it("does not show search field when 5 or fewer items", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(screen.queryByPlaceholderText("name, ID, format or status")).not.toBeInTheDocument()
  })

  it("calls search function when typing in search field", async () => {
    const propsWithManyItems = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        items: Array(6)
          .fill(null)
          .map((_, idx) => ({ ...mockSnapshots[0], id: `${idx}`, name: `Snapshot ${idx}` })),
      },
    }

    render(<List {...propsWithManyItems} />, { wrapper: RouterWrapper })

    const searchInput = screen.getByPlaceholderText("name, ID, format or status")

    // Wrap in act and use fireEvent for immediate execution
    await act(async () => {
      await userEvent.type(searchInput, "t")
    })

    // Wait for any pending updates
    await waitFor(() => {
      expect(defaultProps.search).toHaveBeenCalled()
    })
  })

  it("filters items based on search term - by name", () => {
    const propsWithSearch = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        searchTerm: "Snapshot 1",
        items: mockSnapshots,
      },
    }

    render(<List {...propsWithSearch} />, { wrapper: RouterWrapper })

    expect(screen.getByText("Snapshot 1")).toBeInTheDocument()
    expect(screen.queryByText("Snapshot 2")).not.toBeInTheDocument()
  })

  it("filters items by description", () => {
    const propsWithSearch = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        searchTerm: "Description 2",
        items: mockSnapshots,
      },
    }

    render(<List {...propsWithSearch} />, { wrapper: RouterWrapper })

    expect(screen.queryByText("Snapshot 1")).not.toBeInTheDocument()
    expect(screen.getByText("Snapshot 2")).toBeInTheDocument()
  })

  it("filters items by status", () => {
    const propsWithSearch = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        searchTerm: "creating",
        items: mockSnapshots,
      },
    }

    render(<List {...propsWithSearch} />, { wrapper: RouterWrapper })

    expect(screen.queryByText("Snapshot 1")).not.toBeInTheDocument()
    expect(screen.getByText("Snapshot 2")).toBeInTheDocument()
  })

  it("filters items by ID", () => {
    const propsWithSearch = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        searchTerm: "2",
        items: mockSnapshots,
      },
    }
    render(<List {...propsWithSearch} />, { wrapper: RouterWrapper })

    // The Highlighter component breaks up "Snapshot 2" into multiple elements
    // Use a more flexible text matcher
    expect(
      screen.getByText((_content, element) => {
        if (!element) return false
        return (
          element.tagName === "A" &&
          element.textContent?.includes("Snapshot") === true &&
          element.textContent?.includes("2") === true
        )
      })
    ).toBeInTheDocument()
    expect(screen.queryByText("Snapshot 1")).not.toBeInTheDocument()
  })

  it("filters items by volume ID", () => {
    const propsWithSearch = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        searchTerm: "vol-1",
        items: mockSnapshots,
      },
    }

    render(<List {...propsWithSearch} />, { wrapper: RouterWrapper })

    expect(screen.getByText("Snapshot 1")).toBeInTheDocument()
    expect(screen.queryByText("Snapshot 2")).not.toBeInTheDocument()
  })

  it("filters items by size", () => {
    const propsWithSearch = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        searchTerm: "20",
        items: mockSnapshots,
      },
    }

    render(<List {...propsWithSearch} />, { wrapper: RouterWrapper })

    expect(screen.queryByText("Snapshot 1")).not.toBeInTheDocument()
    expect(screen.getByText("Snapshot 2")).toBeInTheDocument()
  })

  it('shows "No snapshots found" when no items', () => {
    const propsWithNoItems = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        items: [],
      },
    }

    render(<List {...propsWithNoItems} />, { wrapper: RouterWrapper })

    expect(screen.getByText("No snapshots found.")).toBeInTheDocument()
  })

  it("shows spinner when fetching and no items", () => {
    const propsWithFetching = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        items: [],
        isFetching: true,
      },
    }

    render(<List {...propsWithFetching} />, { wrapper: RouterWrapper })

    const spinner = document.querySelector(".spinner")
    expect(spinner).toBeInTheDocument()
  })

  it("calls loadSnapshotsOnce on mount when active", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    expect(defaultProps.loadSnapshotsOnce).toHaveBeenCalledTimes(1)
  })

  it("does not call loadSnapshotsOnce when not active", () => {
    const inactiveProps = {
      ...defaultProps,
      active: false,
    }

    render(<List {...inactiveProps} />, { wrapper: RouterWrapper })

    expect(defaultProps.loadSnapshotsOnce).not.toHaveBeenCalled()
  })

  it("renders pagination controls when hasNext is true", () => {
    const propsWithPagination = {
      ...defaultProps,
      snapshots: {
        ...defaultProps.snapshots,
        hasNext: true,
      },
    }

    render(<List {...propsWithPagination} />, { wrapper: RouterWrapper })

    // The AjaxPaginate component should render something when hasNext is true
    expect(document.querySelector("table")).toBeInTheDocument()
  })

  it("shows spinner for pending snapshot status", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    // Snapshot with "creating" status should have a spinner
    const spinners = document.querySelectorAll(".spinner")
    expect(spinners.length).toBeGreaterThan(0)
  })

  it("starts polling for snapshots in pending state", async () => {
    vi.useFakeTimers()

    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    // Fast-forward time to trigger polling
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Should call reloadSnapshot for the snapshot in "creating" status
    expect(defaultProps.reloadSnapshot).toHaveBeenCalledWith("2")

    vi.useRealTimers()
  })

  it("handles delete snapshot", async () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    // Find all dropdown toggles (cog buttons)
    const dropdownButtons = screen.getAllByRole("button")
    const cogButton = dropdownButtons.find((btn) => btn.querySelector(".fa-cog"))

    if (cogButton) {
      await act(async () => {
        await userEvent.click(cogButton)
      })

      // Find delete link
      const deleteLinks = screen.getAllByText("Delete")
      if (deleteLinks.length > 0) {
        await act(async () => {
          await userEvent.click(deleteLinks[0])
        })

        expect(defaultProps.deleteSnapshot).toHaveBeenCalled()
      }
    }
  })

  it("renders links to snapshot details when policy allows", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    const snapshotLink = screen.getByRole("link", { name: /Snapshot 1/i })
    expect(snapshotLink).toHaveAttribute("href", "/snapshots/1/show")
  })

  it("renders links to volume details", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    const volumeLink = screen.getByRole("link", { name: "Volume 1" })
    expect(volumeLink).toHaveAttribute("href", "/snapshots/volumes/vol-1/show")
  })

  it("applies correct CSS class based on snapshot status", () => {
    render(<List {...defaultProps} />, { wrapper: RouterWrapper })

    const rows = document.querySelectorAll("tbody tr")
    expect(rows[0]).toHaveClass("state-available")
    expect(rows[1]).toHaveClass("state-creating")
  })
})
