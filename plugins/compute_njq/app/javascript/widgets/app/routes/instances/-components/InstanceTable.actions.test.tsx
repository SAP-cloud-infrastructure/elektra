import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { InstanceTable } from "./InstanceTable"
import type { Instance } from "../../../types/instance"

vi.mock("lib/policy", () => ({ policy: { isAllowed: () => true } }))
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

const running: Instance = {
  id: "s1",
  name: "web-01",
  locked: false,
  status: { state: "active", transition: null, power_state: "Running" },
  availability_zone: "qa-de-1a",
  flavor: { id: "f1", name: "m1.small" },
  image: { id: "i1", name: "ubuntu-24.04" },
  ips: [],
  created: "2026-01-01T00:00:00Z",
} as Instance

function renderTable(instances: Instance[]) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <InstanceTable instances={instances} scope={{}} apiClient={{ instances: {} } as never} />
    </QueryClientProvider>
  )
}

describe("InstanceTable actions column", () => {
  it("renders an actions menu (cog) in the trailing column for a running instance", () => {
    const { container } = renderTable([running])
    // The actions menu toggle is a .dropdown-toggle button carrying the cog icon.
    expect(container.querySelector("td .btn-group .dropdown-toggle")).toBeInTheDocument()
    expect(container.querySelector("td .btn-group .fa-cog")).toBeInTheDocument()
  })

  it("renders no actions menu while an instance is transitioning", () => {
    const transitioning = {
      ...running,
      status: { state: "active", transition: "rebooting", power_state: "Running" },
    } as Instance
    const { container } = renderTable([transitioning])
    expect(container.querySelector(".btn-group .dropdown-toggle")).not.toBeInTheDocument()
  })
})
