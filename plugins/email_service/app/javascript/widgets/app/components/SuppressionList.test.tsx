import { render, screen, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import SuppressionList from "./SuppressionList"

vi.mock("moment", () => ({
  default: {
    utc: vi.fn(() => ({
      format: vi.fn(() => "2026-02-22 16:40 UTC"),
    })),
  },
}))

describe("SuppressionList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the heading", () => {
    render(<SuppressionList />)
    expect(screen.getByText("Suppression List")).toBeInTheDocument()
  })

  it("renders column headers", () => {
    render(<SuppressionList />)
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("Reason")).toBeInTheDocument()
    expect(screen.getByText("Original Message ID")).toBeInTheDocument()
    expect(screen.getByText("Date Added")).toBeInTheDocument()
    expect(screen.getByText("Actions")).toBeInTheDocument()
  })

  it("renders initial rows", () => {
    render(<SuppressionList />)
    expect(screen.getByText("bounce-user@example.com")).toBeInTheDocument()
    expect(screen.getByText("complaint-user@example.com")).toBeInTheDocument()
    expect(screen.getByText("invalid-mailbox@example.net")).toBeInTheDocument()
  })

  it("renders the add row with empty inputs", () => {
    render(<SuppressionList />)
    const emailInput = screen.getByPlaceholderText("blocked-user@example.com")
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveValue("")
  })

  it("renders the Add button", () => {
    render(<SuppressionList />)
    expect(screen.getByTitle("Add")).toBeInTheDocument()
  })

  it("renders Remove buttons for existing rows", () => {
    render(<SuppressionList />)
    const removeButtons = screen.getAllByTitle("Remove")
    expect(removeButtons).toHaveLength(3)
  })

  it("adds a new row when email is entered and Add is clicked", async () => {
    const user = userEvent.setup()
    render(<SuppressionList />)

    const emailInput = screen.getByPlaceholderText("blocked-user@example.com")
    await user.type(emailInput, "new-user@example.com")
    await user.click(screen.getByTitle("Add"))

    expect(screen.getByText("new-user@example.com")).toBeInTheDocument()
  })

  it("clears the add row inputs after adding", async () => {
    const user = userEvent.setup()
    render(<SuppressionList />)

    const emailInput = screen.getByPlaceholderText("blocked-user@example.com")
    await user.type(emailInput, "new-user@example.com")
    await user.click(screen.getByTitle("Add"))

    expect(emailInput).toHaveValue("")
  })

  it("does not add a row if email is empty", async () => {
    const user = userEvent.setup()
    render(<SuppressionList />)

    await user.click(screen.getByTitle("Add"))

    // Should still only have 3 initial rows
    const removeButtons = screen.getAllByTitle("Remove")
    expect(removeButtons).toHaveLength(3)
  })

  it("removes a row when Remove is clicked", async () => {
    const user = userEvent.setup()
    render(<SuppressionList />)

    expect(screen.getByText("bounce-user@example.com")).toBeInTheDocument()
    const removeButtons = screen.getAllByTitle("Remove")
    await user.click(removeButtons[0])
    // confirm modal appears — modal renders before the table, so modal's Remove button is first
    const confirmButtons = screen.getAllByRole("button", { name: "Remove" })
    await user.click(confirmButtons[0])

    expect(screen.queryByText("bounce-user@example.com")).not.toBeInTheDocument()
  })

  it("decrements the Remove button count after removal", async () => {
    const user = userEvent.setup()
    render(<SuppressionList />)

    const removeButtons = screen.getAllByTitle("Remove")
    await user.click(removeButtons[0])
    const confirmButtons = screen.getAllByRole("button", { name: "Remove" })
    await user.click(confirmButtons[0])

    expect(screen.getAllByTitle("Remove")).toHaveLength(2)
  })

  it("renders the footer hint text", () => {
    render(<SuppressionList />)
    expect(screen.getByText("Add a new suppressed email directly in the table.")).toBeInTheDocument()
  })

  it("shows Now in the add row date column", () => {
    render(<SuppressionList />)
    expect(screen.getByText("Now")).toBeInTheDocument()
  })

  it("adds a row with reason and message id", async () => {
    const user = userEvent.setup()
    render(<SuppressionList />)

    await user.type(screen.getByPlaceholderText("blocked-user@example.com"), "x@y.com")
    await user.type(screen.getByPlaceholderText(/Manual suppression/), "test reason")
    await user.click(screen.getByTitle("Add"))

    expect(screen.getByText("x@y.com")).toBeInTheDocument()
    expect(screen.getByText("test reason")).toBeInTheDocument()
  })
})
