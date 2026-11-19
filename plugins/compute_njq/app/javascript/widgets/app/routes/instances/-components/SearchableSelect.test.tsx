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

  it("disables the trigger and does not open when disabled", () => {
    render(<SearchableSelect {...common} onChange={vi.fn()} disabled />)
    const trigger = screen.getByText("Select…")
    expect(trigger).toBeDisabled()
    fireEvent.click(trigger)
    // The list never opens, so no search box and no options appear.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
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

  it("sorts ungrouped options alphabetically by label", () => {
    render(<SearchableSelect {...common} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText("Select…"))
    const rendered = screen.getAllByRole("option").map((el) => el.textContent)
    // Input order is ["ubuntu", "debian"]; ungrouped lists are sorted → debian first.
    expect(rendered).toEqual(["debian", "ubuntu"])
  })

  it("keeps the given order when preserveOrder is set", () => {
    render(<SearchableSelect {...common} onChange={vi.fn()} preserveOrder />)
    fireEvent.click(screen.getByText("Select…"))
    const rendered = screen.getAllByRole("option").map((el) => el.textContent)
    // preserveOrder keeps the input order ["ubuntu", "debian"].
    expect(rendered).toEqual(["ubuntu", "debian"])
  })

  it("keeps grouped options in the order the grouping function returns", () => {
    const getGroups = (opts: typeof options) => [{ label: "distros", options: opts }]
    render(<SearchableSelect {...common} onChange={vi.fn()} getGroups={getGroups} />)
    fireEvent.click(screen.getByText("Select…"))
    const rendered = screen.getAllByRole("option").map((el) => el.textContent)
    // Grouped lists are NOT alphabetised; they keep the input order.
    expect(rendered).toEqual(["ubuntu", "debian"])
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

  describe("facets", () => {
    const facets = [
      { key: "u", label: "Ubuntu", matches: (o: { name: string }) => o.name.includes("ubuntu") },
      { key: "d", label: "Debian", matches: (o: { name: string }) => o.name.includes("debian") },
      // A facet that matches nothing should not be offered.
      { key: "w", label: "Windows", matches: (o: { name: string }) => o.name.includes("windows") },
    ]

    it("renders only facets that match at least one option", () => {
      render(<SearchableSelect {...common} onChange={vi.fn()} facets={facets} />)
      fireEvent.click(screen.getByText("Select…"))
      expect(screen.getByRole("button", { name: "Ubuntu" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Debian" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Windows" })).not.toBeInTheDocument()
    })

    it("hides a facet that matches every option (a no-op filter)", () => {
      const all = [{ key: "all", label: "All", matches: () => true }]
      render(<SearchableSelect {...common} onChange={vi.fn()} facets={all} />)
      fireEvent.click(screen.getByText("Select…"))
      expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument()
    })

    it("narrows the list to the active facet and toggles off again", () => {
      render(<SearchableSelect {...common} onChange={vi.fn()} facets={facets} />)
      fireEvent.click(screen.getByText("Select…"))

      // Both visible initially.
      expect(screen.getByRole("option", { name: "ubuntu" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "debian" })).toBeInTheDocument()

      // Activate Ubuntu → only ubuntu remains.
      fireEvent.click(screen.getByRole("button", { name: "Ubuntu" }))
      expect(screen.getByRole("option", { name: "ubuntu" })).toBeInTheDocument()
      expect(screen.queryByRole("option", { name: "debian" })).not.toBeInTheDocument()

      // Toggle Ubuntu off → both back.
      fireEvent.click(screen.getByRole("button", { name: "Ubuntu" }))
      expect(screen.getByRole("option", { name: "debian" })).toBeInTheDocument()
    })

    it("combines two active facets with OR", () => {
      render(<SearchableSelect {...common} onChange={vi.fn()} facets={facets} />)
      fireEvent.click(screen.getByText("Select…"))
      fireEvent.click(screen.getByRole("button", { name: "Ubuntu" }))
      fireEvent.click(screen.getByRole("button", { name: "Debian" }))
      // Both match one of the active facets → both shown.
      expect(screen.getByRole("option", { name: "ubuntu" })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "debian" })).toBeInTheDocument()
    })
  })

  describe("allowCustom", () => {
    it("shows the current value on the trigger even when it is not an option", () => {
      render(<SearchableSelect {...common} value="10.0.0.9" onChange={vi.fn()} allowCustom />)
      expect(screen.getByRole("button")).toHaveTextContent("10.0.0.9")
    })

    it("offers the typed value as a 'Use …' option and commits it", () => {
      const onChange = vi.fn()
      render(<SearchableSelect {...common} value={null} onChange={onChange} allowCustom />)
      fireEvent.click(screen.getByRole("button"))
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "10.0.0.5" } })
      fireEvent.click(screen.getByText(/Use .*10\.0\.0\.5/))
      expect(onChange).toHaveBeenCalledWith("10.0.0.5")
    })

    it("commits the typed value on Enter", () => {
      const onChange = vi.fn()
      render(<SearchableSelect {...common} value={null} onChange={onChange} allowCustom />)
      fireEvent.click(screen.getByRole("button"))
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "192.168.1.1" } })
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" })
      expect(onChange).toHaveBeenCalledWith("192.168.1.1")
    })

    it("offers a None entry that resets the value to empty", () => {
      const onChange = vi.fn()
      render(<SearchableSelect {...common} value="10.0.0.9" onChange={onChange} allowCustom />)
      fireEvent.click(screen.getByRole("button"))
      fireEvent.click(screen.getByText("None"))
      expect(onChange).toHaveBeenCalledWith("")
    })

    it("still lets the user pick a listed option", () => {
      const onChange = vi.fn()
      render(<SearchableSelect {...common} value={null} onChange={onChange} allowCustom />)
      fireEvent.click(screen.getByRole("button"))
      fireEvent.click(screen.getByText("ubuntu"))
      expect(onChange).toHaveBeenCalledWith("a")
    })
  })

  describe("clearable", () => {
    it("shows a None entry only when a value is set and clears it", () => {
      const onChange = vi.fn()
      const { rerender } = render(<SearchableSelect {...common} value={null} onChange={onChange} clearable />)
      fireEvent.click(screen.getByRole("button"))
      // No value yet → no None entry.
      expect(screen.queryByText("None")).not.toBeInTheDocument()

      // With a value selected, None appears and clears it.
      rerender(<SearchableSelect {...common} value="a" onChange={onChange} clearable />)
      fireEvent.click(screen.getByText("None"))
      expect(onChange).toHaveBeenCalledWith("")
    })

    it("does not offer None without the clearable prop", () => {
      render(<SearchableSelect {...common} value="a" onChange={vi.fn()} />)
      fireEvent.click(screen.getByRole("button"))
      expect(screen.queryByText("None")).not.toBeInTheDocument()
    })
  })
})
