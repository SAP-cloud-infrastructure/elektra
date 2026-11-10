import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import { IpList } from "./IpList"

describe("IpList", () => {
  it("renders a dash when there are no IPs", () => {
    render(<IpList ips={{ fixed: [], floating: [] }} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("lists floating IPs first and marks them", () => {
    render(<IpList ips={{ fixed: ["10.0.0.1"], floating: ["1.2.3.4"] }} />)
    expect(screen.getByText("1.2.3.4")).toBeInTheDocument()
    expect(screen.getByText("(floating)")).toBeInTheDocument()
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
  })

  it("collapses to +N more and expands on click", async () => {
    const user = userEvent.setup()
    render(<IpList ips={{ fixed: ["10.0.0.1", "10.0.0.2", "10.0.0.3"], floating: ["1.2.3.4"] }} />)

    // 4 total, MAX_VISIBLE = 2 → 2 hidden
    expect(screen.getByRole("button", { name: "+2 more" })).toBeInTheDocument()
    expect(screen.queryByText("10.0.0.3")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "+2 more" }))

    expect(screen.getByText("10.0.0.3")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument()
  })
})
