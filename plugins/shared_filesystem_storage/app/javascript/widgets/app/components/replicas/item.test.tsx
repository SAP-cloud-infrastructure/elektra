import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ReplicaItem from "./item"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

const mockIsAllowed = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock("lib/policy", () => ({
  policy: { isAllowed: mockIsAllowed },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockReplica = {
  id: "rep-1",
  name: "my-replica",
  share_id: "share-1",
  replica_state: "active",
  status: "available",
  isFetching: false,
  isDeleting: false,
}

const mockShare = { id: "share-1", name: "my-share" }

const defaultProps = {
  replica: mockReplica,
  share: mockShare,
  handleDelete: vi.fn(),
  reloadReplica: vi.fn(),
  promoteReplica: vi.fn(),
  resyncReplica: vi.fn(),
}

const renderComponent = (props = {}) =>
  render(
    <table>
      <tbody>
        <ReplicaItem {...defaultProps} {...props} />
      </tbody>
    </table>
  )

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReplicaItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAllowed.mockReturnValue(true)
  })

  // ── Row rendering ──────────────────────────────────────────────────────────

  describe("Row rendering", () => {
    it("renders replica name as link", () => {
      renderComponent()
      const link = screen.getByText("my-replica")
      expect(link.closest("a")).toHaveAttribute("href", "/replicas/rep-1/show")
    })

    it("renders replica id as info-text when name is set", () => {
      renderComponent()
      expect(screen.getByText("rep-1")).toBeInTheDocument()
    })

    it("renders replica id as link when name is not set", () => {
      renderComponent({ replica: { ...mockReplica, name: undefined } })
      const link = screen.getByText("rep-1")
      expect(link.closest("a")).toHaveAttribute("href", "/replicas/rep-1/show")
    })

    it("renders source share name and id", () => {
      renderComponent()
      expect(screen.getByText("my-share")).toBeInTheDocument()
      expect(screen.getByText("share-1")).toBeInTheDocument()
    })

    it("renders share_id only when share is not found", () => {
      renderComponent({ share: undefined })
      expect(screen.getByText("share-1")).toBeInTheDocument()
    })

    it("renders replica_state", () => {
      renderComponent()
      expect(screen.getByText("active")).toBeInTheDocument()
    })

    it("renders status", () => {
      renderComponent()
      expect(screen.getByText("available")).toBeInTheDocument()
    })

    it("shows spinner when status is creating", () => {
      renderComponent({ replica: { ...mockReplica, status: "creating" } })
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("does not show spinner when status is available", () => {
      renderComponent()
      expect(document.querySelector(".spinner")).not.toBeInTheDocument()
    })

    it("applies 'updating' class when isFetching", () => {
      renderComponent({ replica: { ...mockReplica, isFetching: true } })
      expect(document.querySelector("tr.updating")).toBeInTheDocument()
    })
  })

  // ── Actions menu ───────────────────────────────────────────────────────────

  describe("Actions menu", () => {
    it("renders actions dropdown when any permission is granted", () => {
      renderComponent()
      expect(document.querySelector(".btn-group")).toBeInTheDocument()
    })

    it("renders Delete, Activate, Re-sync, and Error Log actions", () => {
      renderComponent()
      expect(screen.getByText("Delete")).toBeInTheDocument()
      expect(screen.getByText("Activate")).toBeInTheDocument()
      expect(screen.getByText("Re-sync")).toBeInTheDocument()
      expect(screen.getByText("Error Log")).toBeInTheDocument()
    })

    it("does not render actions menu when no permissions granted", () => {
      mockIsAllowed.mockReturnValue(false)
      renderComponent()
      expect(document.querySelector(".btn-group")).not.toBeInTheDocument()
    })

    it("Error Log links to /replicas/:id/error-log", () => {
      renderComponent()
      const errorLogLink = screen.getByText("Error Log").closest("a")
      expect(errorLogLink).toHaveAttribute("href", "/replicas/rep-1/error-log")
    })

    it("does not render Delete when status is creating", () => {
      renderComponent({ replica: { ...mockReplica, status: "creating" } })
      expect(screen.queryByText("Delete")).not.toBeInTheDocument()
    })
  })
})
