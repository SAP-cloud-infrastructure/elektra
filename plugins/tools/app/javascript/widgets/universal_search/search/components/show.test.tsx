import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ShowSearchObjectModal from "./show"
import { projectUrl, objectUrl, vCenterUrl } from "../../shared/object_link_helper"

// ─── Global mocks ────────────────────────────────────────────────────────────

// `policy` is a Rails-injected global — not imported. We simulate it here.
;(global as any).policy = {
  isAllowed: vi.fn().mockReturnValue(true),
}

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ show, onHide, children }: any) => (
      <div data-testid="modal" data-show={String(show)} onClick={onHide}>
        {children}
      </div>
    ),
    {
      Header: ({ children }: any) => <div data-testid="modal-header">{children}</div>,
      Title: ({ children }: any) => <h1 data-testid="modal-title">{children}</h1>,
      Body: ({ children }: any) => <div data-testid="modal-body">{children}</div>,
      Footer: ({ children }: any) => <div data-testid="modal-footer">{children}</div>,
    }
  ),
  Tabs: ({ children, defaultActiveKey }: any) => (
    <div data-testid="tabs" data-default-key={defaultActiveKey}>
      {children}
    </div>
  ),
  Tab: ({ children, title, eventKey }: any) => (
    <div data-testid={`tab-${eventKey}`} data-title={title}>
      {children}
    </div>
  ),
}))

vi.mock("@cloudoperators/juno-ui-components", () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="close-btn" onClick={onClick}>
      {children}
    </button>
  ),
  Spinner: () => <span data-testid="spinner" />,
  JsonViewer: ({ data }: any) => <div data-testid="json-viewer">{JSON.stringify(data)}</div>,
}))

vi.mock("../../shared/object_link_helper", () => ({
  projectUrl: vi.fn().mockReturnValue(null),
  objectUrl: vi.fn().mockReturnValue(null),
  vCenterUrl: vi.fn().mockReturnValue(null),
}))

vi.mock(
  "plugins/identity/app/javascript/widgets/role_assignments/containers/project_role_assignments",
  () => ({ default: () => <div data-testid="project-role-assignments" /> })
)

vi.mock(
  "plugins/identity/app/javascript/widgets/role_assignments/containers/user_role_assignments",
  () => ({ default: () => <div data-testid="user-role-assignments" /> })
)

vi.mock(
  "plugins/networking/app/javascript/widgets/network_usage_stats/containers/application",
  () => ({ default: () => <div data-testid="network-usage-stats" /> })
)

vi.mock("plugins/networking/app/javascript/widgets/asr/application", () => ({
  default: () => <div data-testid="asr" />,
}))

vi.mock("../../topology/containers/object_topology", () => ({
  default: () => <div data-testid="object-topology" />,
}))

// ─── Types ───────────────────────────────────────────────────────────────────

interface Item {
  id: string
  name: string
  cached_object_type: string
  domain_id?: string
  project_id?: string
  payload: Record<string, any>
}

interface Props {
  item?: Item
  project?: object
  aggregates?: { items: any[] }
  match: {
    params: { id?: string }
    path: string
  }
  location: { search: string }
  history: {
    replace: (path: string) => void
    goBack: () => void
  }
  load: (id: string) => Promise<void>
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockItem: Item = {
  id: "abc-123",
  name: "test-object",
  cached_object_type: "server",
  domain_id: "domain-1",
  project_id: "project-1",
  payload: { foo: "bar" },
}

const mockHistory = {
  replace: vi.fn(),
  goBack: vi.fn(),
}

const baseProps: Props = {
  item: mockItem,
  project: {},
  aggregates: { items: [] },
  match: { params: { id: "abc-123" }, path: "/universal-search/:id/show" },
  location: { search: "" },
  history: mockHistory,
  load: vi.fn().mockResolvedValue(undefined),
}

const renderComponent = (props: Partial<Props> = {}) =>
  render(<ShowSearchObjectModal {...baseProps} {...props} />)

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ShowSearchObjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global as any).policy.isAllowed.mockReturnValue(true)
    vi.mocked(vCenterUrl).mockReturnValue(null)
    vi.mocked(objectUrl).mockReturnValue(null)
    vi.mocked(projectUrl).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Initial rendering", () => {
    it("renders the modal as visible", () => {
      renderComponent()
      expect(screen.getByTestId("modal")).toHaveAttribute("data-show", "true")
    })

    it("renders modal title with object type, name and id when item is loaded", () => {
      renderComponent()
      const title = screen.getByTestId("modal-title")
      expect(title).toHaveTextContent("Show server test-object (abc-123)")
    })

    it("renders modal title without item info when item is not loaded", () => {
      renderComponent({ item: undefined })
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Show")
    })

    it("renders Close button", () => {
      renderComponent()
      expect(screen.getByTestId("close-btn")).toHaveTextContent("Close")
    })
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe("Loading state", () => {
    it("shows spinner and loading text when item is missing and id is present", () => {
      const load = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
      renderComponent({ item: undefined, load })
      expect(screen.getByTestId("spinner")).toBeInTheDocument()
    })

    it("calls load with the id from match.params on mount when item is missing", () => {
      const load = vi.fn().mockResolvedValue(undefined)
      renderComponent({ item: undefined, load })
      expect(load).toHaveBeenCalledWith("abc-123")
    })

    it("does not call load when item is already present", () => {
      const load = vi.fn().mockResolvedValue(undefined)
      renderComponent({ load })
      expect(load).not.toHaveBeenCalled()
    })

    it("does not call load when match has no id", () => {
      const load = vi.fn().mockResolvedValue(undefined)
      renderComponent({
        item: undefined,
        match: { params: {}, path: "/universal-search" },
        load,
      })
      expect(load).not.toHaveBeenCalled()
    })

    it("hides spinner and shows data tabs once item arrives via props update", () => {
      const { rerender } = renderComponent({ item: undefined })
      expect(screen.getByTestId("spinner")).toBeInTheDocument()

      rerender(<ShowSearchObjectModal {...baseProps} item={mockItem} />)
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument()
      expect(screen.getByTestId("tabs")).toBeInTheDocument()
    })
  })

  // ── Error state ────────────────────────────────────────────────────────────

  describe("Error state", () => {
    it("shows an error message when load rejects", async () => {
      const load = vi.fn().mockRejectedValue("Something went wrong")
      renderComponent({ item: undefined, load })
      // wait for the promise rejection to be handled
      await vi.waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument()
      })
    })
  })

  // ── Tabs ───────────────────────────────────────────────────────────────────

  describe("Tabs", () => {
    it("always renders the Data tab when item is present", () => {
      renderComponent()
      expect(screen.getByTestId("tab-data")).toBeInTheDocument()
      expect(screen.getByTestId("json-viewer")).toBeInTheDocument()
    })

    it("renders Topology tab when policy allows", () => {
      renderComponent()
      expect(screen.getByTestId("tab-objectTopology")).toBeInTheDocument()
    })

    it("does not render Topology tab when policy denies", () => {
      ;(global as any).policy.isAllowed.mockReturnValue(false)
      renderComponent()
      expect(screen.queryByTestId("tab-objectTopology")).not.toBeInTheDocument()
    })

    it("renders User Role Assignments and Group Role Assignments tabs for a project item", () => {
      const projectItem = { ...mockItem, cached_object_type: "project" }
      renderComponent({ item: projectItem })
      expect(screen.getByTestId("tab-userRoles")).toBeInTheDocument()
      expect(screen.getByTestId("tab-groupRoles")).toBeInTheDocument()
    })

    it("does not render project role assignment tabs when policy denies", () => {
      ;(global as any).policy.isAllowed.mockReturnValue(false)
      const projectItem = { ...mockItem, cached_object_type: "project" }
      renderComponent({ item: projectItem })
      expect(screen.queryByTestId("tab-groupRoles")).not.toBeInTheDocument()
    })

    it("renders User Role Assignments tab for a user item", () => {
      const userItem = { ...mockItem, cached_object_type: "user" }
      renderComponent({ item: userItem })
      expect(screen.getByTestId("tab-userRoles")).toBeInTheDocument()
    })

    it("renders Network Statistics tab for a project item", () => {
      const projectItem = { ...mockItem, cached_object_type: "project" }
      renderComponent({ item: projectItem })
      expect(screen.getByTestId("tab-networkStats")).toBeInTheDocument()
    })

    it("renders Network Statistics tab for a domain item", () => {
      const domainItem = { ...mockItem, cached_object_type: "domain" }
      renderComponent({ item: domainItem })
      expect(screen.getByTestId("tab-networkStats")).toBeInTheDocument()
    })

    it("renders ASR Info tab for a router item", () => {
      const routerItem = { ...mockItem, cached_object_type: "router" }
      renderComponent({ item: routerItem })
      expect(screen.getByTestId("tab-asr")).toBeInTheDocument()
    })

    it("does not render ASR Info tab for non-router items", () => {
      renderComponent() // default is 'server'
      expect(screen.queryByTestId("tab-asr")).not.toBeInTheDocument()
    })

    it("uses the tab query param as the default active tab", () => {
      renderComponent({ location: { search: "?tab=objectTopology" } })
      expect(screen.getByTestId("tabs")).toHaveAttribute("data-default-key", "objectTopology")
    })

    it("defaults to the data tab when no tab query param is present", () => {
      renderComponent({ location: { search: "" } })
      expect(screen.getByTestId("tabs")).toHaveAttribute("data-default-key", "data")
    })

    it("resets activeTab to data when item is a domain and tab=userRoles", () => {
      const domainItem = { ...mockItem, cached_object_type: "domain" }
      renderComponent({ item: domainItem, location: { search: "?tab=userRoles" } })
      expect(screen.getByTestId("tabs")).toHaveAttribute("data-default-key", "data")
    })
  })

  // ── Footer links ───────────────────────────────────────────────────────────

  describe("Footer links", () => {
    it("renders vCenter link when vCenterUrl returns a value", () => {
      vi.mocked(vCenterUrl).mockReturnValue("https://vcenter.example.com")
      renderComponent()
      expect(screen.getByText("Switch to VCenter")).toHaveAttribute("href", "https://vcenter.example.com")
    })

    it("renders Show in Elektra link when objectUrl returns a value", () => {
      vi.mocked(objectUrl).mockReturnValue("/domain-1/project-1/compute/instances?overlay=abc-123")
      renderComponent()
      expect(screen.getByText("Show in Elektra")).toBeInTheDocument()
    })

    it("renders Switch to Project link when projectUrl returns a value and policy allows", () => {
      vi.mocked(projectUrl).mockReturnValue("/domain-1/abc-123/home")
      renderComponent()
      expect(screen.getByText("Switch to Project")).toBeInTheDocument()
    })

    it("does not render footer links when helpers return null", () => {
      renderComponent() // all helpers mocked to return null by default
      expect(screen.queryByText("Switch to VCenter")).not.toBeInTheDocument()
      expect(screen.queryByText("Show in Elektra")).not.toBeInTheDocument()
      expect(screen.queryByText("Switch to Project")).not.toBeInTheDocument()
    })
  })

  // ── Hide / restoreUrl ──────────────────────────────────────────────────────

  describe("Modal close behaviour", () => {
    it("sets modal show to false when Close button is clicked", () => {
      renderComponent()
      fireEvent.click(screen.getByTestId("close-btn"))
      expect(screen.getByTestId("modal")).toHaveAttribute("data-show", "false")
    })

    it("navigates to the list path via history.replace when path matches /:segment/:id/show", () => {
      renderComponent({
        match: { params: { id: "abc-123" }, path: "/universal-search/:id/show" },
      })
      fireEvent.click(screen.getByTestId("close-btn"))
      expect(mockHistory.replace).toHaveBeenCalledWith("/universal-search")
    })

    it("calls history.goBack when path does not match the expected pattern", () => {
      renderComponent({
        match: { params: { id: "abc-123" }, path: "/some/other/path" },
      })
      fireEvent.click(screen.getByTestId("close-btn"))
      expect(mockHistory.goBack).toHaveBeenCalled()
    })
  })
})
