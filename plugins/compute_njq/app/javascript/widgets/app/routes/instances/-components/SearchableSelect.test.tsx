import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SearchableSelect } from "./SearchableSelect"

const options = [
  { id: "a", name: "ubuntu" },
  { id: "b", name: "debian" },
]
const common = {
  options,
  value: null as string | null,
  getLabel: (o: { name: string }) => o.name,
  getValue: (o: { id: string }) => o.id,
  placeholder: "Select…",
  emptyMessage: "Nothing here",
}

describe("SearchableSelect", () => {
  it("filters options client-side by the typed query", () => {
    render(<SearchableSelect {...common} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText("Select…"))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "ubu" } })
    expect(screen.getByText("ubuntu")).toBeInTheDocument()
    expect(screen.queryByText("debian")).not.toBeInTheDocument()
  })

  it("shows the empty message when there are no options", () => {
    render(<SearchableSelect {...common} options={[]} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText("Select…"))
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })

  it("calls onSearch instead of filtering locally when provided", async () => {
    const onSearch = vi.fn()
    render(<SearchableSelect {...common} onChange={vi.fn()} onSearch={onSearch} />)
    fireEvent.click(screen.getByText("Select…"))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "xyz" } })
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("xyz"), { timeout: 500 })
  })

  it("fires onChange with the option value when an option is picked", () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...common} onChange={onChange} />)
    fireEvent.click(screen.getByText("Select…"))
    fireEvent.click(screen.getByText("debian"))
    expect(onChange).toHaveBeenCalledWith("b")
  })

  it("renders non-clickable group headers above options when getGroups is provided", () => {
    const onChange = vi.fn()
    const getGroups = (opts: typeof options) => [{ label: "distros", options: opts }]
    render(<SearchableSelect {...common} onChange={onChange} getGroups={getGroups} />)
    fireEvent.click(screen.getByText("Select…"))

    // The header is present but is not an option and does not fire onChange.
    const header = screen.getByText("distros")
    expect(header).toBeInTheDocument()
    expect(header).not.toHaveAttribute("role", "option")
    fireEvent.click(header)
    expect(onChange).not.toHaveBeenCalled()

    // Options under the group are still clickable.
    fireEvent.click(screen.getByText("ubuntu"))
    expect(onChange).toHaveBeenCalledWith("a")
  })
})
