import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { MultiSelect } from "./MultiSelect"

const options = [
  { id: "a", name: "ubuntu" },
  { id: "b", name: "debian" },
  { id: "c", name: "alpine" },
]
type Option = (typeof options)[number]
const common = {
  options,
  getLabel: (o: { name: string }) => o.name,
  getValue: (o: { id: string }) => o.id,
  placeholder: "Select…",
  emptyMessage: "Nothing here",
}

describe("MultiSelect", () => {
  it("shows the placeholder when nothing is selected", () => {
    render(<MultiSelect {...common} value={[]} onChange={vi.fn()} />)
    expect(screen.getByRole("button")).toHaveTextContent("Select…")
  })

  it("lists the selected names in the trigger, comma-joined", () => {
    render(<MultiSelect {...common} value={["a", "c"]} onChange={vi.fn()} />)
    // Options are sorted alphabetically for display, but the trigger summary
    // reflects the selected set: alpine + ubuntu.
    expect(screen.getByRole("button")).toHaveTextContent("alpine, ubuntu")
  })

  it("collapses to 'N selected' past the selectedLabelLength threshold", () => {
    render(<MultiSelect {...common} value={["a", "b", "c"]} onChange={vi.fn()} selectedLabelLength={2} />)
    expect(screen.getByRole("button")).toHaveTextContent("3 selected")
  })

  it("sorts options alphabetically and renders a checkbox per option", () => {
    render(<MultiSelect {...common} value={[]} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole("button"))
    const rendered = screen.getAllByRole("option").map((el) => el.textContent)
    expect(rendered).toEqual(["alpine", "debian", "ubuntu"])
    expect(screen.getAllByRole("checkbox")).toHaveLength(3)
  })

  it("adds a value when an unchecked option is clicked", () => {
    const onChange = vi.fn()
    render(<MultiSelect {...common} value={["a"]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByText("debian"))
    expect(onChange).toHaveBeenCalledWith(["a", "b"])
  })

  it("removes a value when a checked option is clicked", () => {
    const onChange = vi.fn()
    render(<MultiSelect {...common} value={["a", "b"]} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button"))
    fireEvent.click(screen.getByText("ubuntu"))
    expect(onChange).toHaveBeenCalledWith(["b"])
  })

  it("filters options by the typed query", () => {
    render(<MultiSelect {...common} value={[]} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole("button"))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "deb" } })
    expect(screen.getByText("debian")).toBeInTheDocument()
    expect(screen.queryByText("ubuntu")).not.toBeInTheDocument()
  })

  it("shows the empty message when there are no options", () => {
    render(<MultiSelect {...common} options={[] as Option[]} value={[]} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })

  it("fires onOpen once, only on the first open", () => {
    const onOpen = vi.fn()
    render(<MultiSelect {...common} value={[]} onChange={vi.fn()} onOpen={onOpen} />)
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger) // open
    fireEvent.click(trigger) // close
    fireEvent.click(trigger) // open again
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it("renders non-clickable group headers above options when getGroups is provided", () => {
    const onChange = vi.fn()
    const getGroups = (opts: typeof options) => [
      { label: "linux", options: opts.filter((o) => o.name !== "alpine") },
      { label: "tiny", options: opts.filter((o) => o.name === "alpine") },
    ]
    render(<MultiSelect {...common} value={[]} onChange={onChange} getGroups={getGroups} />)
    fireEvent.click(screen.getByRole("button"))

    // Group headers are present but are not options and do not toggle anything.
    const header = screen.getByText("linux")
    expect(header).toBeInTheDocument()
    expect(header).not.toHaveAttribute("role", "option")
    fireEvent.click(header)
    expect(onChange).not.toHaveBeenCalled()

    // Options under a group remain clickable.
    fireEvent.click(screen.getByText("alpine"))
    expect(onChange).toHaveBeenCalledWith(["c"])
  })

  it("disables the trigger and does not open when disabled", () => {
    const onOpen = vi.fn()
    render(<MultiSelect {...common} value={[]} onChange={vi.fn()} disabled onOpen={onOpen} />)
    const trigger = screen.getByRole("button")
    expect(trigger).toBeDisabled()
    fireEvent.click(trigger)
    // The panel never opens: no search box, no onOpen.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it("shows a loading indicator in the trigger while isLoading", () => {
    render(<MultiSelect {...common} value={[]} onChange={vi.fn()} isLoading disabled />)
    // A visible spinner lives in the trigger (the closed control), so the loading
    // state is seen even when the panel can't be opened.
    const trigger = screen.getByRole("button")
    expect(trigger.querySelector(".spinner")).toBeInTheDocument()
  })
})
