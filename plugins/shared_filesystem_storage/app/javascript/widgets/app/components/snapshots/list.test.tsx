import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import SnapshotList from "./list"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("./item", () => ({
  default: ({ snapshot, share }: any) => (
    <tr data-testid="snapshot-item" data-id={snapshot.id}>
      <td>{snapshot.name}</td>
      <td>{typeof share === "string" ? share : share ? share.name : snapshot.share_id}</td>
    </tr>
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSnapshots = [
  { id: "snap-1", name: "Snapshot 1", share_id: "share-1", status: "available" },
  { id: "snap-2", name: "Snapshot 2", share_id: "share-2", status: "available" },
]

const mockShares = {
  isFetching: false,
  items: [
    { id: "share-1", name: "Share A" },
    { id: "share-2", name: "Share B" },
  ],
}

const defaultProps = {
  active: true,
  isFetching: false,
  snapshots: mockSnapshots,
  shares: mockShares,
  handleDelete: vi.fn(),
  reloadSnapshot: vi.fn(),
  loadSnapshotsOnce: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SnapshotList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Loading dependencies", () => {
    it("calls loadSnapshotsOnce when active on mount", () => {
      render(<SnapshotList {...defaultProps} />)
      expect(defaultProps.loadSnapshotsOnce).toHaveBeenCalledTimes(1)
    })

    it("does not call loadSnapshotsOnce when active is false", () => {
      render(<SnapshotList {...defaultProps} active={false} />)
      expect(defaultProps.loadSnapshotsOnce).not.toHaveBeenCalled()
    })

    it("calls loadSnapshotsOnce when active changes to true", () => {
      const { rerender } = render(<SnapshotList {...defaultProps} active={false} />)
      expect(defaultProps.loadSnapshotsOnce).not.toHaveBeenCalled()

      rerender(<SnapshotList {...defaultProps} active={true} />)
      expect(defaultProps.loadSnapshotsOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Loading state", () => {
    it("shows spinner when isFetching is true", () => {
      render(<SnapshotList {...defaultProps} isFetching={true} />)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("does not show spinner when not fetching", () => {
      render(<SnapshotList {...defaultProps} />)
      expect(document.querySelector(".spinner")).not.toBeInTheDocument()
    })
  })

  describe("Table rendering", () => {
    it("renders a row for each snapshot", () => {
      render(<SnapshotList {...defaultProps} />)
      expect(screen.getAllByTestId("snapshot-item")).toHaveLength(2)
    })

    it("shows empty state message when no snapshots exist", () => {
      render(<SnapshotList {...defaultProps} snapshots={[]} />)
      expect(screen.getByText("No Snapshots found.")).toBeInTheDocument()
    })

    it("passes resolved share to SnapshotItem", () => {
      render(<SnapshotList {...defaultProps} />)
      expect(screen.getByText("Share A")).toBeInTheDocument()
      expect(screen.getByText("Share B")).toBeInTheDocument()
    })

    it("passes share_id when share is not found", () => {
      const snapshots = [{ id: "snap-3", name: "Orphan", share_id: "missing-id", status: "available" }]
      render(<SnapshotList {...defaultProps} snapshots={snapshots} />)
      expect(screen.getByText("missing-id")).toBeInTheDocument()
    })

    it("returns loading string when shares are still fetching", () => {
      const shares = { isFetching: true, items: [] }
      render(<SnapshotList {...defaultProps} shares={shares} />)
      const items = screen.getAllByTestId("snapshot-item")
      expect(items[0]).toHaveTextContent("loading")
    })
  })
})
