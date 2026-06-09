import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ReplicaList from "./list"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("./item", () => ({
  default: ({ replica }: any) => (
    <tr data-testid="replica-item">
      <td>{replica.id}</td>
    </tr>
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockReplicas = [
  { id: "rep-1", share_id: "share-1", replica_state: "active", status: "available" },
  { id: "rep-2", share_id: "share-2", replica_state: "in_sync", status: "available" },
]

const mockShares = {
  isFetching: false,
  items: [
    { id: "share-1", name: "my-share" },
    { id: "share-2", name: "other-share" },
  ],
}

const mockLoadReplicasOnce = vi.fn()
const mockLoadSharesOnce = vi.fn()
const mockHandleDelete = vi.fn()
const mockReloadReplica = vi.fn()
const mockPromoteReplica = vi.fn()
const mockResyncReplica = vi.fn()

const defaultProps = {
  active: true,
  isFetching: false,
  replicas: mockReplicas,
  shares: mockShares,
  loadReplicasOnce: mockLoadReplicasOnce,
  loadSharesOnce: mockLoadSharesOnce,
  handleDelete: mockHandleDelete,
  reloadReplica: mockReloadReplica,
  promoteReplica: mockPromoteReplica,
  resyncReplica: mockResyncReplica,
}

const renderComponent = (props = {}) => render(<ReplicaList {...defaultProps} {...props} />)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReplicaList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe("Loading state", () => {
    it("shows spinner when isFetching is true", () => {
      renderComponent({ isFetching: true })
      expect(document.querySelector(".spinner")).toBeInTheDocument()
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("does not render table when isFetching is true", () => {
      renderComponent({ isFetching: true })
      expect(document.querySelector("table.replicas")).not.toBeInTheDocument()
    })
  })

  // ── Table rendering ────────────────────────────────────────────────────────

  describe("Table rendering", () => {
    it("renders table with correct headers", () => {
      renderComponent()
      expect(screen.getByText("ID")).toBeInTheDocument()
      expect(screen.getByText("Source Share")).toBeInTheDocument()
      expect(screen.getByText("Replica State")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
    })

    it("renders one ReplicaItem per replica", () => {
      renderComponent()
      expect(screen.getAllByTestId("replica-item")).toHaveLength(2)
    })

    it("shows 'No Replicas found.' when replicas list is empty", () => {
      renderComponent({ replicas: [] })
      expect(screen.getByText("No Replicas found.")).toBeInTheDocument()
    })

    it("does not show 'No Replicas found.' when replicas exist", () => {
      renderComponent()
      expect(screen.queryByText("No Replicas found.")).not.toBeInTheDocument()
    })
  })

  // ── Load dependencies ──────────────────────────────────────────────────────

  describe("Load dependencies", () => {
    it("calls loadReplicasOnce and loadSharesOnce on mount when active", () => {
      renderComponent({ active: true })
      expect(mockLoadReplicasOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadSharesOnce).toHaveBeenCalledTimes(1)
    })

    it("does not call load functions on mount when not active", () => {
      renderComponent({ active: false })
      expect(mockLoadReplicasOnce).not.toHaveBeenCalled()
      expect(mockLoadSharesOnce).not.toHaveBeenCalled()
    })

    it("calls loadReplicasOnce when active changes from false to true", () => {
      const { rerender } = renderComponent({ active: false })
      expect(mockLoadReplicasOnce).not.toHaveBeenCalled()

      rerender(<ReplicaList {...defaultProps} active={true} />)
      expect(mockLoadReplicasOnce).toHaveBeenCalledTimes(1)
    })
  })
})
