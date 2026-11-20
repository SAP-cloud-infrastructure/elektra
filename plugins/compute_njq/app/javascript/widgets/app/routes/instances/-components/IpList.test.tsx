import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { ReactNode } from "react"
import { IpList } from "./IpList"

// Stub the router Link with a plain anchor so the cell can be unit tested
// without a RouterProvider.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode
    className?: string
    "aria-label"?: string
  }) => (
    <a href="#" className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

describe("IpList", () => {
  it("renders a dash when there are no IPs", () => {
    render(<IpList ips={[]} instanceId="s1" />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("shows the first fixed IP as the primary address when there is no floating IP", () => {
    render(
      <IpList
        ips={[
          { addr: "10.0.0.1", type: "fixed" },
          { addr: "10.0.0.2", type: "fixed" },
        ]}
        instanceId="s1"
      />
    )
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
    // Secondary IPs are not shown inline; a "+N more" link appears instead.
    expect(screen.queryByText("10.0.0.2")).not.toBeInTheDocument()
    expect(screen.getByText("+1 more")).toBeInTheDocument()
  })

  it("prioritises the floating IP as the primary line and shows the fixed IP beneath", () => {
    render(
      <IpList
        ips={[
          { addr: "10.0.0.1", type: "fixed" },
          { addr: "1.2.3.4", type: "floating" },
        ]}
        instanceId="s1"
      />
    )
    // Floating address is shown prominently as a link to the detail IP tab...
    const floating = screen.getByRole("link", { name: /floating ip/i })
    expect(floating).toHaveTextContent("1.2.3.4")
    // ...with the fixed IP beneath it. Both inline, so no "+N more".
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
    expect(screen.queryByText(/more/)).not.toBeInTheDocument()
  })

  it("counts additional IPs beyond the two shown in '+N more'", () => {
    render(
      <IpList
        ips={[
          { addr: "10.0.0.1", type: "fixed" },
          { addr: "10.0.0.2", type: "fixed" },
          { addr: "1.2.3.4", type: "floating" },
        ]}
        instanceId="s1"
      />
    )
    // floating (primary) + first fixed (secondary) shown → 1 remaining.
    expect(screen.getByText("+1 more")).toBeInTheDocument()
  })

  it("shows no '+N more' when there is only one IP", () => {
    render(<IpList ips={[{ addr: "10.0.0.1", type: "fixed" }]} instanceId="s1" />)
    expect(screen.queryByText(/more/)).not.toBeInTheDocument()
  })

  it("marks the floating IP with a globe and the fixed IP with a sitemap icon", () => {
    const { container } = render(
      <IpList
        ips={[
          { addr: "10.0.0.1", type: "fixed" },
          { addr: "1.2.3.4", type: "floating" },
        ]}
        instanceId="s1"
      />
    )
    // Each line carries a type marker so the address type is unambiguous even
    // when only one line is shown.
    expect(container.querySelector("i.fa.fa-globe.instance-ip-marker")).toBeInTheDocument()
    expect(container.querySelector("i.fa.fa-sitemap.instance-ip-marker")).toBeInTheDocument()
  })

  it("marks a fixed-only server's primary address with the sitemap icon", () => {
    const { container } = render(<IpList ips={[{ addr: "10.0.0.1", type: "fixed" }]} instanceId="s1" />)
    expect(container.querySelector("i.fa.fa-sitemap.instance-ip-marker")).toBeInTheDocument()
    expect(container.querySelector("i.fa.fa-globe")).not.toBeInTheDocument()
  })
})
