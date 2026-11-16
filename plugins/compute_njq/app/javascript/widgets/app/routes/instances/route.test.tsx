import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// The layout route renders the instance list (with toolbar + filters) behind
// the /instances/new and /instances/$id modals. We mock the data hook, the
// Outlet, the InstanceTable, the toolbar and the client-side filter helpers so
// the test focuses on the layout's own branching (toolbar / error / table).
let queryState = {
  data: [] as unknown[],
  isLoading: false,
  isError: false,
  error: null as Error | null,
}
vi.mock("../../hooks/useInstanceQueries", () => ({
  useInstancesQuery: () => queryState,
}))

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useRouteContext: () => ({ apiClient: {} }),
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}))

vi.mock("./-components/InstanceTable", () => ({
  InstanceTable: ({ instances, isLoading }: { instances: unknown[]; isLoading?: boolean }) => (
    <div data-testid="instance-table" data-loading={isLoading ? "true" : "false"}>
      {instances.length} instances
    </div>
  ),
}))

vi.mock("./-components/InstancesToolbar", () => ({
  InstancesToolbar: ({ visibleCount }: { visibleCount: number }) => (
    <div data-testid="toolbar">{visibleCount} visible</div>
  ),
}))

// Pass-through filter helpers so the layout forwards the raw instances.
vi.mock("./-components/filterInstances", () => ({
  filterInstances: (instances: unknown[]) => instances,
  facetValues: () => ({ statuses: [], azs: [] }),
}))

// Imported after the mocks so the module picks them up.
import { Route } from "./route"

const Layout = (Route as unknown as { component: () => JSX.Element }).component

describe("InstancesLayout", () => {
  it("renders the Create New link, the toolbar, the instance table and an outlet for the modal", () => {
    queryState = { data: [{ id: "s1" }], isLoading: false, isError: false, error: null }
    render(<Layout />)
    expect(screen.getByText(/create new/i)).toBeInTheDocument()
    expect(screen.getByTestId("toolbar")).toHaveTextContent("1 visible")
    expect(screen.getByTestId("instance-table")).toHaveTextContent("1 instances")
    expect(screen.getByTestId("outlet")).toBeInTheDocument()
  })

  it("forwards the loading state to the table", () => {
    queryState = { data: [], isLoading: true, isError: false, error: null }
    render(<Layout />)
    expect(screen.getByTestId("instance-table")).toHaveAttribute("data-loading", "true")
  })

  it("shows an error alert when the query fails", () => {
    queryState = { data: [], isLoading: false, isError: true, error: new Error("boom") }
    render(<Layout />)
    expect(screen.getByRole("alert")).toHaveTextContent(/Failed to load instances/)
    expect(screen.getByRole("alert")).toHaveTextContent(/boom/)
  })
})
