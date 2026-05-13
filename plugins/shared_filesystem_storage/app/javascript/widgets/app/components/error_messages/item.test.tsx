import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ErrorMessageItem from "./item"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("lib/components/pretty_date", () => ({
  PrettyDate: ({ date }: any) => <span data-testid="pretty-date">{date}</span>,
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockErrorMessage = {
  id: "em-1",
  project_id: "proj-1",
  resource_type: "share",
  resource_id: "res-1",
  detail_id: "detail-1",
  action_id: "action-1",
  request_id: "req-1",
  created_at: "2024-01-01T00:00:00Z",
  expires_at: "2025-01-01T00:00:00Z",
  message_level: "ERROR",
  user_message: "Something went wrong",
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ErrorMessageItem", () => {
  // ── Row rendering ──────────────────────────────────────────────────────────

  describe("Row rendering", () => {
    it("renders message_level in first column", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      expect(screen.getByText("ERROR")).toBeInTheDocument()
    })

    it("renders user_message in second column", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    it("renders PrettyDate with created_at in third column", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      expect(screen.getByTestId("pretty-date")).toHaveTextContent("2024-01-01T00:00:00Z")
    })

    it("renders a toggle icon (caret-right) when details are hidden", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      expect(document.querySelector(".fa-caret-right")).toBeInTheDocument()
      expect(document.querySelector(".fa-caret-down")).not.toBeInTheDocument()
    })
  })

  // ── Toggle details ─────────────────────────────────────────────────────────

  describe("Toggle details", () => {
    it("shows details row when toggle is clicked", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      const toggle = document.querySelector("a")!
      fireEvent.click(toggle)
      expect(document.querySelector("tr.details")).toBeInTheDocument()
    })

    it("switches icon to caret-down when expanded", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      fireEvent.click(document.querySelector("a")!)
      expect(document.querySelector(".fa-caret-down")).toBeInTheDocument()
      expect(document.querySelector(".fa-caret-right")).not.toBeInTheDocument()
    })

    it("hides details row when toggled twice", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      const toggle = document.querySelector("a")!
      fireEvent.click(toggle)
      fireEvent.click(toggle)
      expect(document.querySelector("tr.details")).not.toBeInTheDocument()
    })

    it("renders all detail fields in the details table", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      fireEvent.click(document.querySelector("a")!)

      const expectedFields = [
        "project_id",
        "id",
        "resource_type",
        "resource_id",
        "detail_id",
        "action_id",
        "request_id",
        "created_at",
        "expires_at",
      ]
      for (const field of expectedFields) {
        expect(screen.getByText(field)).toBeInTheDocument()
      }
    })

    it("renders detail values in the details table", () => {
      render(
        <table>
          <tbody>
            <ErrorMessageItem errorMessage={mockErrorMessage} />
          </tbody>
        </table>
      )
      fireEvent.click(document.querySelector("a")!)
      expect(screen.getByText("proj-1")).toBeInTheDocument()
      expect(screen.getByText("res-1")).toBeInTheDocument()
    })
  })
})
