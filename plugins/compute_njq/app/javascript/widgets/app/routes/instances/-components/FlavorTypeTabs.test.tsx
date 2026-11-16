import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FlavorTypeTabs } from "./FlavorTypeTabs"

describe("FlavorTypeTabs", () => {
  it("renders only the available tabs with their labels", () => {
    render(<FlavorTypeTabs value={null} onChange={vi.fn()} availableTabs={["kvm", "vmware"]} />)
    expect(screen.getByRole("tab", { name: "KVM" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "VMware" })).toBeInTheDocument()
    // Not offered → not rendered.
    expect(screen.queryByRole("tab", { name: "Other" })).not.toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Baremetal" })).not.toBeInTheDocument()
  })

  it("marks the selected tab active", () => {
    render(<FlavorTypeTabs value="vmware" onChange={vi.fn()} availableTabs={["kvm", "vmware"]} />)
    expect(screen.getByRole("tab", { name: "VMware" })).toHaveClass("active")
    expect(screen.getByRole("tab", { name: "KVM" })).not.toHaveClass("active")
  })

  it("invokes onChange with the clicked tab", () => {
    const onChange = vi.fn()
    render(<FlavorTypeTabs value={null} onChange={onChange} availableTabs={["kvm", "baremetal"]} />)
    fireEvent.click(screen.getByRole("tab", { name: "Baremetal" }))
    expect(onChange).toHaveBeenCalledWith("baremetal")
  })
})
