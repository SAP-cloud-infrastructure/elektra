import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ShareList from "./list"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

const mockIsAllowed = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock("lib/policy", () => ({
  policy: { isAllowed: mockIsAllowed },
}))

vi.mock("lib/components/defeatable_link", () => ({
  DefeatableLink: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock("lib/components/Overlay", () => ({
  Popover: ({ children, title }: any) => (
    <div data-testid="popover" data-title={title}>
      {children}
    </div>
  ),
  Tooltip: ({ children }: any) => <span>{children}</span>,
}))

vi.mock("lib/components/search_field", () => ({
  SearchField: ({ onChange, placeholder }: any) => (
    <input
      data-testid="search-field"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

vi.mock("lib/components/ajax_paginate", () => ({
  AjaxPaginate: ({ hasNext, isFetching, onLoadNext }: any) => (
    <button
      data-testid="load-next"
      disabled={!hasNext || isFetching}
      onClick={onLoadNext}
    >
      Load more
    </button>
  ),
}))

vi.mock("react-transition-group", () => ({
  TransitionGroup: ({ component: Tag = "div", children }: any) => <Tag>{children}</Tag>,
  CSSTransition: ({ children }: any) => <>{children}</>,
}))

vi.mock("lib/components/transitions", () => ({
  FadeTransition: ({ children }: any) => <>{children}</>,
}))

vi.mock("./item", () => ({
  default: ({ share }: any) => (
    <tr data-testid="share-item" data-id={share.id}>
      <td>{share.name}</td>
    </tr>
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockShares = [
  { id: "s-1", name: "Share 1", status: "available", isHidden: false, share_network_id: "sn-1" },
  { id: "s-2", name: "Share 2", status: "available", isHidden: false, share_network_id: "sn-1" },
]

const mockShareNetworks = {
  isFetching: false,
  items: [{ id: "sn-1", name: "My Network" }],
}

const defaultProps = {
  active: true,
  isFetching: false,
  items: mockShares,
  shareNetworks: mockShareNetworks,
  shareRules: {},
  searchTerm: "",
  hasNext: false,
  handleDelete: vi.fn(),
  handleForceDelete: vi.fn(),
  reloadShare: vi.fn(),
  loadShareRulesOnce: vi.fn(),
  loadSharesOnce: vi.fn(),
  loadShareNetworksOnce: vi.fn(),
  loadAvailabilityZonesOnce: vi.fn(),
  searchShares: vi.fn(),
  loadNext: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShareList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAllowed.mockReturnValue(true)
  })

  describe("Loading dependencies", () => {
    it("calls loadSharesOnce when active on mount", () => {
      render(<ShareList {...defaultProps} />)
      expect(defaultProps.loadSharesOnce).toHaveBeenCalledTimes(1)
    })

    it("calls loadShareNetworksOnce when active on mount", () => {
      render(<ShareList {...defaultProps} />)
      expect(defaultProps.loadShareNetworksOnce).toHaveBeenCalledTimes(1)
    })

    it("calls loadAvailabilityZonesOnce when active on mount", () => {
      render(<ShareList {...defaultProps} />)
      expect(defaultProps.loadAvailabilityZonesOnce).toHaveBeenCalledTimes(1)
    })

    it("does not call load functions when active is false", () => {
      render(<ShareList {...defaultProps} active={false} />)
      expect(defaultProps.loadSharesOnce).not.toHaveBeenCalled()
      expect(defaultProps.loadShareNetworksOnce).not.toHaveBeenCalled()
      expect(defaultProps.loadAvailabilityZonesOnce).not.toHaveBeenCalled()
    })

    it("calls load functions when active changes to true", () => {
      const { rerender } = render(<ShareList {...defaultProps} active={false} />)
      expect(defaultProps.loadSharesOnce).not.toHaveBeenCalled()

      rerender(<ShareList {...defaultProps} active={true} />)
      expect(defaultProps.loadSharesOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Table rendering", () => {
    it("renders a row for each share", () => {
      render(<ShareList {...defaultProps} />)
      expect(screen.getAllByTestId("share-item")).toHaveLength(2)
    })

    it("shows empty state message when no shares exist", () => {
      render(<ShareList {...defaultProps} items={[]} />)
      expect(screen.getByText("No Shares found.")).toBeInTheDocument()
    })

    it("shows spinner in empty row when isFetching", () => {
      render(<ShareList {...defaultProps} items={[]} isFetching={true} />)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("does not render hidden shares", () => {
      const items = [
        ...mockShares,
        { id: "s-3", name: "Hidden", status: "available", isHidden: true, share_network_id: "sn-1" },
      ]
      render(<ShareList {...defaultProps} items={items} />)
      expect(screen.getAllByTestId("share-item")).toHaveLength(2)
    })
  })

  describe("Search", () => {
    it("renders search field when items exist", () => {
      render(<ShareList {...defaultProps} />)
      expect(screen.getByTestId("search-field")).toBeInTheDocument()
    })

    it("does not render search field when no items", () => {
      render(<ShareList {...defaultProps} items={[]} />)
      expect(screen.queryByTestId("search-field")).not.toBeInTheDocument()
    })

    it("filters shares by search term", () => {
      const items = [
        { id: "s-1", name: "Alpha", status: "available", isHidden: false, share_network_id: "sn-1" },
        { id: "s-2", name: "Beta", status: "available", isHidden: false, share_network_id: "sn-1" },
      ]
      render(<ShareList {...defaultProps} items={items} searchTerm="Alpha" />)
      expect(screen.getAllByTestId("share-item")).toHaveLength(1)
    })

    it("calls searchShares on search input change", () => {
      render(<ShareList {...defaultProps} />)
      fireEvent.change(screen.getByTestId("search-field"), { target: { value: "test" } })
      expect(defaultProps.searchShares).toHaveBeenCalledWith("test")
    })
  })

  describe("Create New button", () => {
    it("renders Create New link when permission and share networks exist", () => {
      mockIsAllowed.mockReturnValue(true)
      render(<ShareList {...defaultProps} />)
      expect(screen.getByRole("link", { name: /create new/i })).toBeInTheDocument()
    })

    it("renders disabled button when no share networks exist", () => {
      render(
        <ShareList
          {...defaultProps}
          shareNetworks={{ isFetching: false, items: [] }}
        />
      )
      expect(screen.getByTestId("popover")).toBeInTheDocument()
    })

    it("does not render toolbar when share_create permission is denied", () => {
      mockIsAllowed.mockImplementation(
        (p: string) => p !== "shared_filesystem_storage:share_create"
      )
      render(<ShareList {...defaultProps} />)
      expect(screen.queryByTestId("search-field")).not.toBeInTheDocument()
      expect(screen.queryByRole("link", { name: /create new/i })).not.toBeInTheDocument()
    })
  })

  describe("Permissions", () => {
    it("shows not allowed message when share_list permission is denied", () => {
      mockIsAllowed.mockImplementation(
        (p: string) => p !== "shared_filesystem_storage:share_list"
      )
      render(<ShareList {...defaultProps} />)
      expect(screen.getByText("You are not allowed to see this page")).toBeInTheDocument()
    })
  })

  describe("Pagination", () => {
    it("renders pagination when hasNext is true", () => {
      render(<ShareList {...defaultProps} hasNext={true} />)
      expect(screen.getByTestId("load-next")).toBeInTheDocument()
    })
  })
})
