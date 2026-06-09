import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import SnapshotItem from "./item"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

const mockIsAllowed = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock("lib/policy", () => ({
  policy: { isAllowed: mockIsAllowed },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSnapshot = {
  id: "snap-1",
  name: "My Snapshot",
  share_id: "share-1",
  size: 5,
  status: "available",
  isFetching: false,
  isDeleting: false,
}

const mockShare = { id: "share-1", name: "My Share" }

const defaultProps = {
  snapshot: mockSnapshot,
  share: mockShare,
  handleDelete: vi.fn(),
  reloadSnapshot: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SnapshotItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockIsAllowed.mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Row rendering", () => {
    it("renders snapshot name as link", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByRole("link", { name: "My Snapshot" })).toHaveAttribute(
        "href",
        "/snapshots/snap-1/show"
      )
    })

    it("renders snapshot id as info-text when name is set", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("snap-1")).toBeInTheDocument()
    })

    it("renders snapshot id as link when name is not set", () => {
      const snapshot = { ...mockSnapshot, name: undefined }
      render(<table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>)
      expect(screen.getByRole("link", { name: "snap-1" })).toBeInTheDocument()
    })

    it("renders source share name and id", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("My Share")).toBeInTheDocument()
      expect(screen.getByText("share-1")).toBeInTheDocument()
    })

    it("renders share_id only when share is not found", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} share={null} /></tbody></table>)
      expect(screen.getByText("share-1")).toBeInTheDocument()
      expect(screen.queryByText("My Share")).not.toBeInTheDocument()
    })

    it("renders size", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("5 GB")).toBeInTheDocument()
    })

    it("renders status", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("available")).toBeInTheDocument()
    })

    it("shows spinner when status is creating", () => {
      const snapshot = { ...mockSnapshot, status: "creating" }
      render(<table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("applies updating class when isFetching is true", () => {
      const snapshot = { ...mockSnapshot, isFetching: true }
      render(<table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>)
      expect(document.querySelector("tr.updating")).toBeInTheDocument()
    })

    it("applies updating class when isDeleting is true", () => {
      const snapshot = { ...mockSnapshot, isDeleting: true }
      render(<table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>)
      expect(document.querySelector("tr.updating")).toBeInTheDocument()
    })
  })

  describe("Actions menu", () => {
    it("renders actions dropdown when any permission is granted", () => {
      mockIsAllowed.mockReturnValue(true)
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(document.querySelector(".btn-group")).toBeInTheDocument()
    })

    it("does not render actions when no permissions granted", () => {
      mockIsAllowed.mockReturnValue(false)
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(document.querySelector(".btn-group")).not.toBeInTheDocument()
    })

    it("renders Delete action with snapshot_delete permission when not creating", () => {
      mockIsAllowed.mockImplementation(
        (p: string) => p === "shared_filesystem_storage:snapshot_delete"
      )
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("Delete")).toBeInTheDocument()
    })

    it("does not render Delete when status is creating", () => {
      mockIsAllowed.mockImplementation(
        (p: string) => p === "shared_filesystem_storage:snapshot_delete"
      )
      const snapshot = { ...mockSnapshot, status: "creating" }
      render(<table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>)
      expect(screen.queryByText("Delete")).not.toBeInTheDocument()
    })

    it("calls handleDelete when Delete is clicked", () => {
      mockIsAllowed.mockImplementation(
        (p: string) => p === "shared_filesystem_storage:snapshot_delete"
      )
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      fireEvent.click(screen.getByText("Delete"))
      expect(defaultProps.handleDelete).toHaveBeenCalledWith("snap-1")
    })

    it("renders Edit action with snapshot_update permission", () => {
      mockIsAllowed.mockImplementation(
        (p: string) => p === "shared_filesystem_storage:snapshot_update"
      )
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument()
    })

    it("renders Error Log link", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)
      expect(screen.getByRole("link", { name: "Error Log" })).toHaveAttribute(
        "href",
        "/snapshots/snap-1/error-log"
      )
    })
  })

  describe("Polling", () => {
    it("starts polling when status is creating on mount", () => {
      const snapshot = { ...mockSnapshot, status: "creating" }
      render(<table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>)

      vi.advanceTimersByTime(10000)
      expect(defaultProps.reloadSnapshot).toHaveBeenCalledWith("snap-1")
    })

    it("does not poll when status is not creating", () => {
      render(<table><tbody><SnapshotItem {...defaultProps} /></tbody></table>)

      vi.advanceTimersByTime(20000)
      expect(defaultProps.reloadSnapshot).not.toHaveBeenCalled()
    })

    it("stops polling when status changes from creating", () => {
      const { rerender } = render(
        <table><tbody><SnapshotItem {...defaultProps} snapshot={{ ...mockSnapshot, status: "creating" }} /></tbody></table>
      )

      rerender(
        <table><tbody><SnapshotItem {...defaultProps} snapshot={{ ...mockSnapshot, status: "available" }} /></tbody></table>
      )

      vi.advanceTimersByTime(20000)
      expect(defaultProps.reloadSnapshot).not.toHaveBeenCalled()
    })

    it("stops polling on unmount", () => {
      const snapshot = { ...mockSnapshot, status: "creating" }
      const { unmount } = render(
        <table><tbody><SnapshotItem {...defaultProps} snapshot={snapshot} /></tbody></table>
      )
      unmount()

      vi.advanceTimersByTime(20000)
      expect(defaultProps.reloadSnapshot).not.toHaveBeenCalled()
    })
  })
})
