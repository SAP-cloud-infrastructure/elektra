import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { InstanceTable } from "./InstanceTable"
import type { Instance } from "../../../types/instance"

const policyState = vi.hoisted(() => ({ allowed: true }))
vi.mock("lib/policy", () => ({ policy: { isAllowed: () => policyState.allowed } }))
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

function renderTable(instances: Instance[], onOpenConsole = vi.fn()) {
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <InstanceTable
        instances={instances}
        scope={{}}
        apiClient={{ instances: {} } as never}
        onOpenConsole={onOpenConsole}
      />
    </QueryClientProvider>
  )
  return { onOpenConsole }
}

describe("InstanceTable actions column", () => {
  it("renders an actions menu (cog) in the trailing column for a running instance", () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <InstanceTable instances={[running]} scope={{}} apiClient={{ instances: {} } as never} />
      </QueryClientProvider>
    )
    // The actions menu toggle is a .dropdown-toggle button carrying the cog icon.
    expect(container.querySelector("td .btn-group .dropdown-toggle")).toBeInTheDocument()
    expect(container.querySelector("td .btn-group .fa-cog")).toBeInTheDocument()
  })

  it("shows a disabled actions toggle while an instance is transitioning", () => {
    const transitioning = {
      ...running,
      status: { state: "active", transition: "rebooting", power_state: "Running" },
    } as Instance
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <InstanceTable instances={[transitioning]} scope={{}} apiClient={{ instances: {} } as never} />
      </QueryClientProvider>
    )
    const toggle = container.querySelector(".btn-group .dropdown-toggle")
    expect(toggle).toBeInTheDocument()
    expect(toggle).toBeDisabled()
  })

  it("shows the web-console terminal icon for a running instance and opens it on click", () => {
    policyState.allowed = true
    const { onOpenConsole } = renderTable([running])
    const btn = screen.getByRole("button", { name: /web console/i })
    fireEvent.click(btn)
    expect(onOpenConsole).toHaveBeenCalledWith({ id: "s1", name: "web-01" })
  })

  it("hides the web-console icon for a stopped instance", () => {
    policyState.allowed = true
    const stopped = { ...running, status: { state: "stopped", transition: null, power_state: "Shut off" } } as Instance
    renderTable([stopped])
    expect(screen.queryByRole("button", { name: /web console/i })).not.toBeInTheDocument()
  })

  it("hides the web-console icon when the policy denies it", () => {
    policyState.allowed = false
    renderTable([running])
    expect(screen.queryByRole("button", { name: /web console/i })).not.toBeInTheDocument()
    policyState.allowed = true
  })
})
