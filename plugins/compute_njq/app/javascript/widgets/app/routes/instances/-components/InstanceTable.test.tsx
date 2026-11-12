import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { ReactNode } from "react"
import { InstanceTable } from "./InstanceTable"
import type { Instance } from "../../../types/instance"

// Stub TanStack Router's <Link> with a plain anchor so the table can be unit
// tested without a RouterProvider (the row name is a Link to the detail route).
// Forward `title` so the truncation-tooltip assertions work.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, title }: { children: ReactNode; title?: string }) => (
    <a href="#" title={title}>
      {children}
    </a>
  ),
}))

const instance: Instance = {
  id: "s1",
  name: "web-01",
  status: { state: "active", transition: null },
  availability_zone: "qa-de-1a",
  flavor: { id: "f1", name: "m1.small" },
  image: { id: "i1", name: "ubuntu-24.04" },
  ips: [
    { addr: "10.0.0.5", type: "fixed" },
    { addr: "203.0.113.9", type: "floating" },
  ],
  created: "2026-01-01T00:00:00Z",
}

describe("InstanceTable", () => {
  it("renders an empty-state message when there are no instances", () => {
    render(<InstanceTable instances={[]} />)
    expect(screen.getByText("No instances found.")).toBeInTheDocument()
  })

  it("renders instance name, resolved flavor and image, and status", () => {
    render(<InstanceTable instances={[instance]} />)
    expect(screen.getByText("web-01")).toBeInTheDocument()
    // The OS / Size cell shows the image name and the flavor (each on its own
    // labelled row).
    expect(screen.getByText("ubuntu-24.04")).toBeInTheDocument()
    expect(screen.getByText("m1.small")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders the availability zone in its own column", () => {
    render(<InstanceTable instances={[instance]} />)
    expect(screen.getByText("qa-de-1a")).toBeInTheDocument()
  })

  it("truncates a long name and exposes the full name as a title tooltip", () => {
    const longName = "shoot--5aa5dfe849--esther-test-worker-l9igb-z1-857d5-rj7hj"
    render(<InstanceTable instances={[{ ...instance, name: longName }]} />)
    const link = screen.getByTitle(longName)
    expect(link.textContent).toContain("…")
    expect(link.textContent!.length).toBeLessThan(longName.length)
  })

  it("does not set a title on short names", () => {
    render(<InstanceTable instances={[instance]} />)
    const link = screen.getByRole("link", { name: "web-01" })
    expect(link).not.toHaveAttribute("title")
  })

  it("falls back to the id when the name is null", () => {
    render(<InstanceTable instances={[{ ...instance, name: null }]} />)
    // The row link shows the id as its label when the name is missing.
    expect(screen.getByRole("link", { name: "s1" })).toBeInTheDocument()
  })

  it("shows the id beneath the name with a copy button", () => {
    render(<InstanceTable instances={[instance]} />)
    // The id (s1) appears in the muted second line plus a copy button.
    expect(screen.getByRole("button", { name: "Copy ID" })).toBeInTheDocument()
  })

  it("shows 'No image' with a boot-from-volume tooltip when there is no image at all", () => {
    render(<InstanceTable instances={[{ ...instance, image: { id: null, name: null } }]} />)
    const noImage = screen.getByText("No image")
    fireEvent.mouseEnter(noImage.closest("span")!.parentElement!)
    expect(screen.getByRole("tooltip")).toHaveTextContent(/boot-from-volume/i)
  })

  it("shows the image id (muted, truncated) with a 'could not resolve' tooltip when unresolved", () => {
    render(<InstanceTable instances={[{ ...instance, image: { id: "abcdef12-3456-7890-dead-beef", name: null } }]} />)
    // Shown truncated to its first 18 chars; the full id is in the title.
    const idValue = screen.getByText("abcdef12-3456-7890…")
    expect(idValue).toHaveClass("instance-image-id")
    expect(idValue).toHaveAttribute("title", "abcdef12-3456-7890-dead-beef")
    fireEvent.mouseEnter(idValue.closest("span")!.parentElement!)
    expect(screen.getByRole("tooltip")).toHaveTextContent(/could not be resolved/i)
  })

  it("shows skeleton loading rows (not data) while loading", () => {
    render(<InstanceTable instances={[]} isLoading />)
    expect(screen.getByTestId("instances-skeleton")).toBeInTheDocument()
    // The empty-state message must not show while loading.
    expect(screen.queryByText("No instances found.")).not.toBeInTheDocument()
  })

  it("does not show skeleton rows once loaded", () => {
    render(<InstanceTable instances={[instance]} isLoading={false} />)
    expect(screen.queryByTestId("instances-skeleton")).not.toBeInTheDocument()
    expect(screen.getByText("web-01")).toBeInTheDocument()
  })
})

describe("InstanceTable sorting", () => {
  const alpha: Instance = {
    ...instance,
    id: "a",
    name: "alpha",
    availability_zone: "qa-de-1c",
    created: "2026-01-01T00:00:00Z",
  }
  const bravo: Instance = {
    ...instance,
    id: "b",
    name: "bravo",
    availability_zone: "qa-de-1a",
    created: "2026-03-01T00:00:00Z",
  }
  const charlie: Instance = {
    ...instance,
    id: "c",
    name: "charlie",
    availability_zone: "qa-de-1b",
    created: "2026-02-01T00:00:00Z",
  }

  // Order of the data rows by their row link (name) text.
  const rowNames = () =>
    screen
      .getAllByRole("row")
      .slice(1) // drop the header row
      .map((row) => within(row).getByRole("link").textContent)

  it("keeps the given order until a sortable header is clicked", () => {
    render(<InstanceTable instances={[bravo, alpha, charlie]} />)
    expect(rowNames()).toEqual(["bravo", "alpha", "charlie"])
  })

  it("sorts ascending, then descending, then back to original on repeated clicks", () => {
    render(<InstanceTable instances={[bravo, alpha, charlie]} />)
    const nameHeader = screen.getByText("Name")

    fireEvent.click(nameHeader)
    expect(rowNames()).toEqual(["alpha", "bravo", "charlie"])

    fireEvent.click(nameHeader)
    expect(rowNames()).toEqual(["charlie", "bravo", "alpha"])

    fireEvent.click(nameHeader)
    expect(rowNames()).toEqual(["bravo", "alpha", "charlie"])
  })

  it("sorts by availability zone", () => {
    render(<InstanceTable instances={[bravo, alpha, charlie]} />)
    fireEvent.click(screen.getByText("AZ"))
    // bravo=1a, charlie=1b, alpha=1c
    expect(rowNames()).toEqual(["bravo", "charlie", "alpha"])
  })

  it("sorts by created-at chronologically", () => {
    render(<InstanceTable instances={[bravo, alpha, charlie]} />)
    fireEvent.click(screen.getByText("Created at"))
    expect(rowNames()).toEqual(["alpha", "charlie", "bravo"])
  })

  it("shows a neutral sort icon on sortable headers and an active one once sorted", () => {
    const { container } = render(<InstanceTable instances={[alpha, bravo]} />)
    // All sortable headers start with the neutral fa-sort icon.
    expect(container.querySelectorAll("i.fa.fa-sort").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText("Name"))
    expect(container.querySelector("i.fa.fa-sort-asc")).toBeInTheDocument()
  })
})
