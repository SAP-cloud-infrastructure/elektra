import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// The layout route renders the instance list behind the /instances/new modal.
// We mock the data hook, the Outlet, and the InstanceTable so the test focuses
// on the layout's own branching (toolbar / error / loading / table).
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
  InstanceTable: ({ instances }: { instances: unknown[] }) => (
    <div data-testid="instance-table">{instances.length} instances</div>
  ),
}))

// Imported after the mocks so the module picks them up.
import { Route } from "./route"

const Layout = (Route as unknown as { component: () => JSX.Element }).component

describe("InstancesLayout", () => {
  it("renders the Create New link and the instance table and an outlet for the modal", () => {
    queryState = { data: [{ id: "s1" }], isLoading: false, isError: false, error: null }
    render(<Layout />)
    expect(screen.getByText(/create new/i)).toBeInTheDocument()
    expect(screen.getByTestId("instance-table")).toHaveTextContent("1 instances")
    expect(screen.getByTestId("outlet")).toBeInTheDocument()
  })

  it("shows a spinner while loading instead of the table", () => {
    queryState = { data: [], isLoading: true, isError: false, error: null }
    render(<Layout />)
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.queryByTestId("instance-table")).not.toBeInTheDocument()
  })

  it("shows an error alert when the query fails", () => {
    queryState = { data: [], isLoading: false, isError: true, error: new Error("boom") }
    render(<Layout />)
    expect(screen.getByRole("alert")).toHaveTextContent(/Failed to load instances/)
    expect(screen.getByRole("alert")).toHaveTextContent(/boom/)
  })
})
