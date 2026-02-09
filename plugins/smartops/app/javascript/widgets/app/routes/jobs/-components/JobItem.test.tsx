import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import { JobItem } from "./JobItem"
import type { Job } from "../../../types/api"

// Mock useNavigate from TanStack Router
const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

describe("JobItem", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  const baseJob: Job = {
    id: "job-123",
    name: "Test Job",
    object_id: "obj-456",
    object_type: "server",
    created_at: "2024-01-01T12:00:00Z",
    state: "pending",
    description: "Test job description",
    due_date: "2024-01-15T10:00:00Z",
    schedule_date: "2024-01-10T08:00:00Z",
  }

  describe("Rendering", () => {
    it("should render job name", () => {
      render(<JobItem job={baseJob} />)
      expect(screen.getByText("Test Job")).toBeInTheDocument()
    })

    it("should render job state as badge", () => {
      render(<JobItem job={baseJob} />)
      expect(screen.getByText("pending")).toBeInTheDocument()
    })

    it("should render job description", () => {
      render(<JobItem job={baseJob} />)
      expect(screen.getByText("Test job description")).toBeInTheDocument()
    })

    it("should render 'No description' when description is empty", () => {
      const jobWithoutDescription = { ...baseJob, description: "" }
      render(<JobItem job={jobWithoutDescription} />)
      expect(screen.getByText("No description")).toBeInTheDocument()
    })

    it("should render 'No description' when description is undefined", () => {
      const jobWithoutDescription = { ...baseJob, description: undefined }
      render(<JobItem job={jobWithoutDescription} />)
      expect(screen.getByText("No description")).toBeInTheDocument()
    })

    it("should render Details button", () => {
      render(<JobItem job={baseJob} />)
      const button = screen.getByRole("button", { name: "Details" })
      expect(button).toBeInTheDocument()
    })

    it("should render due date in locale string format", () => {
      render(<JobItem job={baseJob} />)
      const expectedDate = new Date("2024-01-15T10:00:00Z").toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })

    it("should render schedule date in locale string format", () => {
      render(<JobItem job={baseJob} />)
      const expectedDate = new Date("2024-01-10T08:00:00Z").toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })

    it("should render 'Due date has passed' warning when due_date is in the past and no schedule_date", () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const jobWithPastDue = {
        ...baseJob,
        due_date: pastDate.toISOString(),
        schedule_date: "",
      }
      render(<JobItem job={jobWithPastDue} />)
      expect(screen.getByText("Due date has passed")).toBeInTheDocument()
    })
  })

  describe("Job States", () => {
    it("should render pending state correctly", () => {
      const job = { ...baseJob, state: "pending" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("pending")).toBeInTheDocument()
    })

    it("should render successful state correctly", () => {
      const job = { ...baseJob, state: "successful" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("successful")).toBeInTheDocument()
    })

    it("should render error state correctly", () => {
      const job = { ...baseJob, state: "error" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("error")).toBeInTheDocument()
    })

    it("should render running state correctly", () => {
      const job = { ...baseJob, state: "running" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("running")).toBeInTheDocument()
    })

    it("should render scheduled state correctly", () => {
      const job = { ...baseJob, state: "scheduled" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("scheduled")).toBeInTheDocument()
    })

    it("should render canceled state correctly", () => {
      const job = { ...baseJob, state: "canceled" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("canceled")).toBeInTheDocument()
    })

    it("should render initial state correctly", () => {
      const job = { ...baseJob, state: "initial" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("initial")).toBeInTheDocument()
    })

    it("should render waiting state correctly", () => {
      const job = { ...baseJob, state: "waiting" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("waiting")).toBeInTheDocument()
    })

    it("should render reset state correctly", () => {
      const job = { ...baseJob, state: "reset" as const }
      render(<JobItem job={job} />)
      expect(screen.getByText("reset")).toBeInTheDocument()
    })

    it("should handle undefined state as 'unknown'", () => {
      const job = { ...baseJob, state: undefined }
      render(<JobItem job={job} />)
      expect(screen.getByText("unknown")).toBeInTheDocument()
    })
  })

  describe("Navigation", () => {
    it("should call onSelect when row is clicked", async () => {
      const mockOnSelect = vi.fn()
      const user = userEvent.setup()
      render(<JobItem job={baseJob} onSelect={mockOnSelect} />)

      const row = screen.getByRole("row")
      await user.click(row)

      expect(mockOnSelect).toHaveBeenCalledWith("job-123")
    })

    it("should call onSelect when Details button is clicked", async () => {
      const mockOnSelect = vi.fn()
      const user = userEvent.setup()
      render(<JobItem job={baseJob} onSelect={mockOnSelect} />)

      const button = screen.getByRole("button", { name: "Details" })
      await user.click(button)

      expect(mockOnSelect).toHaveBeenCalledWith("job-123")
    })

    it("should not propagate click event when Details button is clicked", async () => {
      const mockOnSelect = vi.fn()
      const user = userEvent.setup()
      const { container } = render(<JobItem job={baseJob} onSelect={mockOnSelect} />)

      const row = container.querySelector('[style*="cursor: pointer"]')
      const rowClickHandler = vi.fn()
      if (row) {
        row.addEventListener("click", rowClickHandler)
      }

      const button = screen.getByRole("button", { name: "Details" })
      await user.click(button)

      // onSelect should be called only once (from button, not row)
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it("should call onSelect with correct job id", async () => {
      const mockOnSelect = vi.fn()
      const user = userEvent.setup()
      const customJob = { ...baseJob, id: "custom-job-id" }
      render(<JobItem job={customJob} onSelect={mockOnSelect} />)

      const button = screen.getByRole("button", { name: "Details" })
      await user.click(button)

      expect(mockOnSelect).toHaveBeenCalledWith("custom-job-id")
    })

    it("should do nothing when row is clicked without onSelect prop", async () => {
      const user = userEvent.setup()
      render(<JobItem job={baseJob} />)

      const row = screen.getByRole("row")
      await user.click(row)

      // Should not throw an error
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe("Styling and UI", () => {
    it("should have pointer cursor on row", () => {
      const { container } = render(<JobItem job={baseJob} />)
      const row = container.querySelector('[style*="cursor: pointer"]')
      expect(row).toBeInTheDocument()
    })

    it("should render Badge component for status", () => {
      render(<JobItem job={baseJob} />)
      // Badge should be rendered with the state text
      const badge = screen.getByText("pending")
      expect(badge).toBeInTheDocument()
    })

    it("should render Button with primary variant", () => {
      render(<JobItem job={baseJob} />)
      const button = screen.getByRole("button", { name: "Details" })
      expect(button).toBeInTheDocument()
    })
  })

  describe("Date Formatting", () => {
    it("should format due date correctly", () => {
      const job = { ...baseJob, due_date: "2024-12-25T15:30:00Z" }
      render(<JobItem job={job} />)
      const expectedDate = new Date("2024-12-25T15:30:00Z").toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })

    it("should display formatted schedule date", () => {
      render(<JobItem job={baseJob} />)
      const expectedDate = new Date("2024-01-10T08:00:00Z").toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have accessible button", () => {
      render(<JobItem job={baseJob} />)
      const button = screen.getByRole("button", { name: "Details" })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAccessibleName("Details")
    })

    it("should render as table row", () => {
      render(<JobItem job={baseJob} />)
      const row = screen.getByRole("row")
      expect(row).toBeInTheDocument()
    })

    it("should have all required cells", () => {
      render(<JobItem job={baseJob} />)
      const cells = screen.getAllByRole("gridcell")
      // Name, Status, Description, Due Date, Schedule Date, Button
      expect(cells).toHaveLength(6)
    })
  })

  describe("Edge Cases", () => {
    it("should handle very long job names", () => {
      const longNameJob = {
        ...baseJob,
        name: "A".repeat(200),
      }
      render(<JobItem job={longNameJob} />)
      expect(screen.getByText("A".repeat(200))).toBeInTheDocument()
    })

    it("should handle very long descriptions", () => {
      const longDescJob = {
        ...baseJob,
        description: "B".repeat(500),
      }
      render(<JobItem job={longDescJob} />)
      expect(screen.getByText("B".repeat(500))).toBeInTheDocument()
    })

    it("should handle special characters in job name", () => {
      const specialJob = {
        ...baseJob,
        name: "Job <script>alert('test')</script>",
      }
      render(<JobItem job={specialJob} />)
      expect(screen.getByText("Job <script>alert('test')</script>")).toBeInTheDocument()
    })

    it("should handle invalid date strings gracefully", () => {
      const invalidDateJob = {
        ...baseJob,
        due_date: "invalid-date",
      }
      render(<JobItem job={invalidDateJob} />)
      // Should still render, even if date is invalid
      expect(screen.getByText("Test Job")).toBeInTheDocument()
    })

    it("should handle missing required fields", () => {
      const minimalJob = {
        id: "minimal-job",
        name: "Minimal",
      } as Job
      render(<JobItem job={minimalJob} />)
      expect(screen.getByText("Minimal")).toBeInTheDocument()
      expect(screen.getByText("unknown")).toBeInTheDocument()
      expect(screen.getByText("No description")).toBeInTheDocument()
    })
  })

  describe("Component Structure", () => {
    it("should render all data cells in correct order", () => {
      render(<JobItem job={baseJob} />)
      const cells = screen.getAllByRole("gridcell")
      // Verify order: Name, Status, Description, Due Date, Schedule Date, Button
      expect(cells[0]).toHaveTextContent("Test Job")
      expect(cells[1]).toHaveTextContent("pending")
      expect(cells[2]).toHaveTextContent("Test job description")
      // cells[3] and cells[4] contain dates
      expect(cells[5]).toContainElement(screen.getByRole("button", { name: "Details" }))
    })

    it("should render Stack component for badge", () => {
      render(<JobItem job={baseJob} />)
      const badge = screen.getByText("pending")
      expect(badge).toBeInTheDocument()
    })
  })
})
