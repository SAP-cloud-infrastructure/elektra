import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { FlavorTypeTabs } from "./FlavorTypeTabs"

describe("FlavorTypeTabs", () => {
  it("renders only the available options with their labels", () => {
    render(<FlavorTypeTabs value={null} onChange={vi.fn()} availableTabs={["kvm", "vmware"]} />)
    expect(screen.getByRole("radio", { name: "KVM" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "VMware" })).toBeInTheDocument()
    // Not offered → not rendered.
    expect(screen.queryByRole("radio", { name: "Other" })).not.toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: "Baremetal" })).not.toBeInTheDocument()
  })

  it("marks the selected option as checked", () => {
    render(<FlavorTypeTabs value="vmware" onChange={vi.fn()} availableTabs={["kvm", "vmware"]} />)
    expect(screen.getByRole("radio", { name: "VMware" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "KVM" })).not.toBeChecked()
  })

  it("invokes onChange with the chosen option", () => {
    const onChange = vi.fn()
    render(<FlavorTypeTabs value={null} onChange={onChange} availableTabs={["kvm", "baremetal"]} />)
    fireEvent.click(screen.getByRole("radio", { name: "Baremetal" }))
    expect(onChange).toHaveBeenCalledWith("baremetal")
  })
})
