import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import React from "react"
import Snapshot from "./item"

// Mock dependencies
vi.mock("lib/ajax_helper", () => ({
  scope: {
    domain: "test-domain",
  },
}))

vi.mock("react-bootstrap-typeahead", () => ({
  Highlighter: ({ children, search }: { children: string; search?: string }) => {
    if (!search) return <span>{children}</span>
    return <mark>{children}</mark>
  },
}))

// Define the policy type
interface PolicyType {
  isAllowed: (permission: string, options?: any) => boolean
}

// Mock global policy object
const mockPolicy = {
  isAllowed: vi.fn(),
}

// Setup global policy
beforeEach(() => {
  global.policy = mockPolicy
})

afterEach(() => {
  vi.clearAllMocks()
})

// Types
interface MockSnapshot {
  id: string
  name: string
  description: string
  size: number
  status: string
  volume_id?: string
  volume_name?: string
}

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <table>
      <tbody>{children}</tbody>
    </table>
  </BrowserRouter>
)

describe("Snapshot Component", () => {
  let mockReloadSnapshot: ReturnType<typeof vi.fn>
  let mockDeleteSnapshot: ReturnType<typeof vi.fn>
  let mockSnapshot: MockSnapshot

  beforeEach(() => {
    mockReloadSnapshot = vi.fn()
    mockDeleteSnapshot = vi.fn()
    mockSnapshot = {
      id: "snapshot-123",
      name: "Test Snapshot",
      description: "Test Description",
      size: 10,
      status: "available",
      volume_id: "volume-456",
      volume_name: "Test Volume",
    }

    // Reset policy mock
    mockPolicy.isAllowed.mockReturnValue(true)

    // Clear all timers
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe("Rendering", () => {
    it("renders snapshot information correctly", () => {
      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
      expect(screen.getByText("snapshot-123")).toBeInTheDocument()
      expect(screen.getByText("Test Description")).toBeInTheDocument()
      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getByText("available")).toBeInTheDocument()
    })

    it("renders with searchTerm highlighting", () => {
      render(
        <TestWrapper>
          <Snapshot
            snapshot={mockSnapshot}
            searchTerm="Test"
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      // Should render highlighted text (mocked as <mark>)
      const highlightedElements = screen.getAllByText("Test Snapshot")
      expect(highlightedElements.length).toBeGreaterThan(0)
    })

    it("applies correct CSS class based on status", () => {
      const { container } = render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const row = container.querySelector("tr")
      expect(row).toHaveClass("state-available")
    })
  })

  describe("Volume Information", () => {
    it("renders volume link when volume_name exists", () => {
      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const volumeLink = screen.getByRole("link", { name: "Test Volume" })
      expect(volumeLink).toHaveAttribute("href", "/snapshots/volumes/volume-456/show")
      expect(screen.getByText("volume-456")).toBeInTheDocument()
    })

    it("renders only volume_id when volume_name is missing", () => {
      const snapshotWithoutVolumeName = {
        ...mockSnapshot,
        volume_name: undefined,
      }

      render(
        <TestWrapper>
          <Snapshot
            snapshot={snapshotWithoutVolumeName}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      expect(screen.getByText("volume-456")).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: "Test Volume" })).not.toBeInTheDocument()
    })
  })

  describe("Permissions and Links", () => {
    it("renders snapshot name as link when snapshot_get permission is allowed", () => {
      mockPolicy.isAllowed.mockImplementation((permission: string) => permission === "block_storage:snapshot_get")

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const snapshotLink = screen.getByRole("link", { name: "Test Snapshot" })
      expect(snapshotLink).toHaveAttribute("href", "/snapshots/snapshot-123/show")
    })

    it("renders snapshot name as plain text when snapshot_get permission is denied", () => {
      mockPolicy.isAllowed.mockReturnValue(false)

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: "Test Snapshot" })).not.toBeInTheDocument()
    })
  })

  describe("Actions Dropdown", () => {
    it("renders actions dropdown when permissions are granted", () => {
      mockPolicy.isAllowed.mockReturnValue(true)

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const dropdownButton = screen.getByRole("button")
      expect(dropdownButton).toBeInTheDocument()
      expect(dropdownButton).not.toBeDisabled()
    })

    it("hides actions dropdown when no permissions are granted", () => {
      mockPolicy.isAllowed.mockReturnValue(false)

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })

    it("disables dropdown button when snapshot is in pending state", () => {
      const pendingSnapshot = { ...mockSnapshot, status: "creating" }

      render(
        <TestWrapper>
          <Snapshot
            snapshot={pendingSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      const dropdownButton = screen.getByRole("button")
      expect(dropdownButton).toBeDisabled()
    })

    it("renders Edit link when snapshot_update permission is allowed", () => {
      mockPolicy.isAllowed.mockImplementation((permission: string) => permission === "block_storage:snapshot_update")

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const editLink = screen.getByRole("link", { name: "Edit" })
      expect(editLink).toHaveAttribute("href", "/snapshots/snapshot-123/edit")
    })

    it("renders Create Volume link when snapshot status is available", () => {
      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const createVolumeLink = screen.getByRole("link", { name: "Create Volume" })
      expect(createVolumeLink).toHaveAttribute("href", "/snapshots/snapshot-123/volumes/new")
    })

    it("hides Create Volume link when snapshot status is not available", () => {
      const unavailableSnapshot = { ...mockSnapshot, status: "error" }

      render(
        <TestWrapper>
          <Snapshot
            snapshot={unavailableSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      expect(screen.queryByRole("link", { name: "Create Volume" })).not.toBeInTheDocument()
    })

    it("renders Delete link when snapshot_delete permission is allowed", () => {
      mockPolicy.isAllowed.mockImplementation((permission: string) => permission === "block_storage:snapshot_delete")

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      expect(screen.getByText("Delete")).toBeInTheDocument()
    })

    it("renders Reset Status link when snapshot_reset_status permission is allowed", async () => {
      mockPolicy.isAllowed.mockImplementation(
        (permission: string) => permission === "block_storage:snapshot_reset_status"
      )

      await render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )
      const resetStatusLink = await screen.getByRole("link", { name: "Reset Status" })
      expect(resetStatusLink).toHaveAttribute("href", "/snapshots/snapshot-123/reset-status")
    })
  })

  describe("Delete Functionality", () => {
    it("calls deleteSnapshot when delete link is clicked", () => {
      mockPolicy.isAllowed.mockImplementation((permission: string) => permission === "block_storage:snapshot_delete")

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const deleteLink = screen.getByText("Delete")
      fireEvent.click(deleteLink)

      expect(mockDeleteSnapshot).toHaveBeenCalledWith("snapshot-123")
    })

    it("prevents default event when delete is clicked", () => {
      mockPolicy.isAllowed.mockImplementation((permission: string) => permission === "block_storage:snapshot_delete")

      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      const deleteLink = screen.getByText("Delete")
      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault")

      fireEvent(deleteLink, clickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe("Polling Functionality", () => {
    it("starts polling on mount when snapshot is in pending state", () => {
      const pendingSnapshot = { ...mockSnapshot, status: "creating" }

      render(
        <TestWrapper>
          <Snapshot
            snapshot={pendingSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      // Fast-forward time
      vi.advanceTimersByTime(5000)

      expect(mockReloadSnapshot).toHaveBeenCalledWith("snapshot-123")
    })

    it("does not start polling when snapshot is not in pending state", () => {
      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      vi.advanceTimersByTime(5000)

      expect(mockReloadSnapshot).not.toHaveBeenCalled()
    })

    it("stops polling when component unmounts", () => {
      const pendingSnapshot = { ...mockSnapshot, status: "creating" }

      const { unmount } = render(
        <TestWrapper>
          <Snapshot
            snapshot={pendingSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      // Verify polling started
      vi.advanceTimersByTime(5000)
      expect(mockReloadSnapshot).toHaveBeenCalledTimes(1)

      // Unmount and verify polling stops
      unmount()
      vi.advanceTimersByTime(10000)
      expect(mockReloadSnapshot).toHaveBeenCalledTimes(1)
    })

    it("starts polling when status changes to pending", () => {
      const { rerender } = render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      // Initially not polling
      vi.advanceTimersByTime(5000)
      expect(mockReloadSnapshot).not.toHaveBeenCalled()

      // Change to pending status
      const pendingSnapshot = { ...mockSnapshot, status: "creating" }
      rerender(
        <TestWrapper>
          <Snapshot
            snapshot={pendingSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      // Should start polling
      vi.advanceTimersByTime(5000)
      expect(mockReloadSnapshot).toHaveBeenCalledWith("snapshot-123")
    })

    it("stops polling when status changes from pending to non-pending", () => {
      const pendingSnapshot = { ...mockSnapshot, status: "creating" }

      const { rerender } = render(
        <TestWrapper>
          <Snapshot
            snapshot={pendingSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      // Verify polling started
      vi.advanceTimersByTime(5000)
      expect(mockReloadSnapshot).toHaveBeenCalledTimes(1)

      // Change to non-pending status
      rerender(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      // Should stop polling
      mockReloadSnapshot.mockClear()
      vi.advanceTimersByTime(10000)
      expect(mockReloadSnapshot).not.toHaveBeenCalled()
    })
  })

  describe("Pending State Indicator", () => {
    it("shows spinner when snapshot is in pending state", () => {
      const pendingSnapshot = { ...mockSnapshot, status: "creating" }

      const { container } = render(
        <TestWrapper>
          <Snapshot
            snapshot={pendingSnapshot}
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      expect(container.querySelector(".spinner")).toBeInTheDocument()
    })

    it("hides spinner when snapshot is not in pending state", () => {
      const { container } = render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      expect(container.querySelector(".spinner")).not.toBeInTheDocument()
    })
  })

  describe("MyHighlighter Component", () => {
    it("returns children when no search term is provided", () => {
      render(
        <TestWrapper>
          <Snapshot snapshot={mockSnapshot} reloadSnapshot={mockReloadSnapshot} deleteSnapshot={mockDeleteSnapshot} />
        </TestWrapper>
      )

      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
    })

    it("returns children when children is empty", () => {
      const emptySnapshot = { ...mockSnapshot, name: "" }

      render(
        <TestWrapper>
          <Snapshot
            snapshot={emptySnapshot}
            searchTerm="test"
            reloadSnapshot={mockReloadSnapshot}
            deleteSnapshot={mockDeleteSnapshot}
          />
        </TestWrapper>
      )

      // Should not crash and should render empty content
      expect(screen.queryByText("test")).not.toBeInTheDocument()
    })
  })
})
