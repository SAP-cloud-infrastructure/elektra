import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ShareItem from "./item"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

const mockIsAllowed = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock("lib/policy", () => ({
  policy: { isAllowed: mockIsAllowed },
}))

vi.mock("lib/components/Overlay", () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  ),
}))

const mockIsShareStatusPending = vi.hoisted(() => vi.fn().mockReturnValue(false))

vi.mock("../../constants", () => ({
  isShareStatusPending: mockIsShareStatusPending,
}))

vi.mock("./actions", () => ({
  default: ({ isPending }: any) => (
    <div data-testid="share-actions" data-pending={String(isPending)} />
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockShare = {
  id: "share-1",
  name: "My Share",
  availability_zone: "az-1",
  share_proto: "NFS",
  size: 10,
  status: "available",
  isDeleting: false,
}

const mockShareNetwork = { id: "sn-1", name: "My Network", cidr: "192.168.1.0/24" }

const mockShareRules = {
  isFetching: false,
  items: [
    { id: "rule-1", access_level: "rw", access_to: "10.0.0.1" },
    { id: "rule-2", access_level: "ro", access_to: "10.0.0.2" },
  ],
}

const defaultProps = {
  share: mockShare,
  shareNetwork: mockShareNetwork,
  shareRules: mockShareRules,
  handleDelete: vi.fn(),
  handleForceDelete: vi.fn(),
  reloadShare: vi.fn(),
  loadShareRulesOnce: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShareItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockIsAllowed.mockReturnValue(true)
    mockIsShareStatusPending.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Row rendering", () => {
    it("renders share name as link", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByRole("link", { name: "My Share" })).toHaveAttribute("href", "/shares/share-1/show")
    })

    it("renders share id as link when name is not set", () => {
      const share = { ...mockShare, name: undefined }
      render(<table><tbody><ShareItem {...defaultProps} share={share} /></tbody></table>)
      expect(screen.getByRole("link", { name: "share-1" })).toBeInTheDocument()
    })

    it("renders availability zone", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("az-1")).toBeInTheDocument()
    })

    it("renders protocol", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("NFS")).toBeInTheDocument()
    })

    it("renders size", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("10 GB")).toBeInTheDocument()
    })

    it("renders status", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("available")).toBeInTheDocument()
    })

    it("shows spinner when status is creating", () => {
      const share = { ...mockShare, status: "creating" }
      render(<table><tbody><ShareItem {...defaultProps} share={share} /></tbody></table>)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("applies updating class when isDeleting is true", () => {
      const share = { ...mockShare, isDeleting: true }
      render(<table><tbody><ShareItem {...defaultProps} share={share} /></tbody></table>)
      expect(document.querySelector("tr.updating")).toBeInTheDocument()
    })
  })

  describe("Share network and rules", () => {
    it("renders share network name", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText("My Network")).toBeInTheDocument()
    })

    it("renders share network cidr", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getByText(/192\.168\.1\.0\/24/)).toBeInTheDocument()
    })

    it("shows spinner while share rules are fetching", () => {
      const shareRules = { isFetching: true, items: [] }
      render(<table><tbody><ShareItem {...defaultProps} shareRules={shareRules} /></tbody></table>)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("renders access rules with tooltips", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(screen.getAllByTestId("tooltip")).toHaveLength(2)
      expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
      expect(screen.getByText("10.0.0.2")).toBeInTheDocument()
    })

    it("shows spinner when shareNetwork is null", () => {
      render(<table><tbody><ShareItem {...defaultProps} shareNetwork={null} /></tbody></table>)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })
  })

  describe("Loading dependencies", () => {
    it("calls loadShareRulesOnce on mount", () => {
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)
      expect(defaultProps.loadShareRulesOnce).toHaveBeenCalledWith("share-1")
    })
  })

  describe("Polling", () => {
    it("starts polling when share status is pending on mount", () => {
      mockIsShareStatusPending.mockReturnValue(true)
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)

      vi.advanceTimersByTime(5000)
      expect(defaultProps.reloadShare).toHaveBeenCalledWith("share-1")
    })

    it("does not poll when share status is not pending", () => {
      mockIsShareStatusPending.mockReturnValue(false)
      render(<table><tbody><ShareItem {...defaultProps} /></tbody></table>)

      vi.advanceTimersByTime(10000)
      expect(defaultProps.reloadShare).not.toHaveBeenCalled()
    })

    it("stops polling when status changes to non-pending", () => {
      mockIsShareStatusPending.mockReturnValue(true)
      const { rerender } = render(
        <table><tbody><ShareItem {...defaultProps} share={{ ...mockShare, status: "creating" }} /></tbody></table>
      )

      mockIsShareStatusPending.mockReturnValue(false)
      rerender(
        <table><tbody><ShareItem {...defaultProps} share={{ ...mockShare, status: "available" }} /></tbody></table>
      )

      vi.advanceTimersByTime(10000)
      expect(defaultProps.reloadShare).not.toHaveBeenCalled()
    })

    it("stops polling on unmount", () => {
      mockIsShareStatusPending.mockReturnValue(true)
      const { unmount } = render(
        <table><tbody><ShareItem {...defaultProps} /></tbody></table>
      )
      unmount()

      vi.advanceTimersByTime(10000)
      expect(defaultProps.reloadShare).not.toHaveBeenCalled()
    })
  })
})
