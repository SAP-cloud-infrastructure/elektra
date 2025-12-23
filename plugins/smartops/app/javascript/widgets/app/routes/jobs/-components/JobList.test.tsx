// jobs/-components/JobList.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { JobList } from "./JobList"
import type { Job } from "../../../types/api"

// Mock useNavigate from TanStack Router
const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

describe("JobList", () => {
  const mockJobs: Job[] = [
    {
      id: "1",
      name: "Database Migration",
      state: "pending",
      description: "Migrate production database",
      due_date: "2024-01-15T10:00:00Z",
      schedule_date: "2024-01-10T08:00:00Z",
    },
    {
      id: "2",
      name: "Security Audit",
      state: "completed",
      description: "Annual security audit",
      due_date: "2024-02-20T15:30:00Z",
      schedule_date: "2024-02-15T09:00:00Z",
    },
    {
      id: "3",
      name: "System Backup",
      state: "failed",
      description: "",
      due_date: "2024-03-01T12:00:00Z",
      schedule_date: null,
    },
  ] as Job[]

  describe("Header", () => {
    it("should render all header columns in correct order", () => {
      render(<JobList jobs={[]} />)

      const headers = screen.getAllByRole("columnheader")
      expect(headers).toHaveLength(6)
      expect(headers[0]).toHaveTextContent("Name")
      expect(headers[1]).toHaveTextContent("Status")
      expect(headers[2]).toHaveTextContent("Description")
      expect(headers[3]).toHaveTextContent("Due Date")
      expect(headers[4]).toHaveTextContent("Schedule Date")
      expect(headers[5]).toHaveTextContent("") // Empty header for actions
    })
  })

  describe("Loading State", () => {
    it("should display spinner with correct aria-label when loading", () => {
      render(<JobList jobs={[]} isLoading={true} />)

      const spinner = screen.getByLabelText("Loading Jobs")
      expect(spinner).toBeInTheDocument()
    })

    it("should render header even when loading", () => {
      render(<JobList jobs={[]} isLoading={true} />)

      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
    })

    it("should not display jobs when loading", () => {
      render(<JobList jobs={mockJobs} isLoading={true} />)

      expect(screen.queryByText("Database Migration")).not.toBeInTheDocument()
      expect(screen.queryByText("Security Audit")).not.toBeInTheDocument()
    })

    it("should not display empty state message when loading", () => {
      render(<JobList jobs={[]} isLoading={true} />)

      expect(screen.queryByText(/No Jobs found/)).not.toBeInTheDocument()
    })
  })

  describe("Empty State", () => {
    it("should display empty message when no jobs exist", () => {
      render(<JobList jobs={[]} isLoading={false} />)

      const emptyMessage = screen.getByRole("status")
      expect(emptyMessage).toHaveTextContent("No Jobs found, nothing to do 👍")
    })

    it("should not display spinner in empty state", () => {
      render(<JobList jobs={[]} isLoading={false} />)

      expect(screen.queryByLabelText("Loading Jobs")).not.toBeInTheDocument()
    })

    it("should still render header in empty state", () => {
      render(<JobList jobs={[]} />)

      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
    })
  })

  describe("Jobs Display", () => {
    it("should render all jobs when provided", () => {
      render(<JobList jobs={mockJobs} />)

      expect(screen.getByText("Database Migration")).toBeInTheDocument()
      expect(screen.getByText("Security Audit")).toBeInTheDocument()
      expect(screen.getByText("System Backup")).toBeInTheDocument()
    })

    it("should display job names correctly", () => {
      render(<JobList jobs={mockJobs} />)

      mockJobs.forEach((job) => {
        expect(screen.getByText(job.name)).toBeInTheDocument()
      })
    })

    it("should display job statuses with badges", () => {
      render(<JobList jobs={mockJobs} />)

      expect(screen.getByText("pending")).toBeInTheDocument()
      expect(screen.getByText("completed")).toBeInTheDocument()
      expect(screen.getByText("failed")).toBeInTheDocument()
    })

    it("should display job descriptions or default text", () => {
      render(<JobList jobs={mockJobs} />)

      expect(screen.getByText("Migrate production database")).toBeInTheDocument()
      expect(screen.getByText("Annual security audit")).toBeInTheDocument()
      expect(screen.getByText("No description")).toBeInTheDocument()
    })

    it("should display Details button for each job", () => {
      render(<JobList jobs={mockJobs} />)

      const detailButtons = screen.getAllByText("Details")
      expect(detailButtons).toHaveLength(mockJobs.length)
    })

    it("should not display empty message when jobs exist", () => {
      render(<JobList jobs={mockJobs} />)

      expect(screen.queryByText(/No Jobs found/)).not.toBeInTheDocument()
    })

    it("should not display spinner when jobs are loaded", () => {
      render(<JobList jobs={mockJobs} isLoading={false} />)

      expect(screen.queryByLabelText("Loading Jobs")).not.toBeInTheDocument()
    })
  })

  describe("Data Grid Structure", () => {
    it("should render DataGrid with correct structure", () => {
      const { container } = render(<JobList jobs={mockJobs} />)

      // Check that content is rendered
      expect(container).not.toBeEmptyDOMElement()
    })

    it("should render correct number of rows", () => {
      render(<JobList jobs={mockJobs} />)

      const rows = screen.getAllByRole("row")
      // 1 header row + 3 job rows = 4 total
      expect(rows).toHaveLength(4)
    })

    it("should have correct table headers", () => {
      render(<JobList jobs={mockJobs} />)

      const columnHeaders = screen.getAllByRole("columnheader")
      expect(columnHeaders).toHaveLength(6)
    })
  })

  describe("Edge Cases", () => {
    it("should handle undefined isLoading prop", () => {
      render(<JobList jobs={mockJobs} />)

      expect(screen.queryByLabelText("Loading Jobs")).not.toBeInTheDocument()
      expect(screen.getByText("Database Migration")).toBeInTheDocument()
    })

    it("should handle single job correctly", () => {
      const singleJob = [mockJobs[0]]
      render(<JobList jobs={singleJob} />)

      expect(screen.getByText("Database Migration")).toBeInTheDocument()
      expect(screen.queryByText("Security Audit")).not.toBeInTheDocument()
    })

    it("should handle job without state field", () => {
      const jobWithoutState = [
        {
          ...mockJobs[0],
          state: undefined,
        },
      ] as Job[]

      render(<JobList jobs={jobWithoutState} />)

      expect(screen.getByText("unknown")).toBeInTheDocument()
    })

    it("should render many jobs efficiently", () => {
      const manyJobs = Array.from({ length: 50 }, (_, i) => ({
        id: `job-${i}`,
        name: `Job ${i}`,
        state: "pending",
        description: `Description ${i}`,
        due_date: "2024-01-01T00:00:00Z",
        schedule_date: "2024-01-01T00:00:00Z",
      })) as Job[]

      render(<JobList jobs={manyJobs} />)

      expect(screen.getByText("Job 0")).toBeInTheDocument()
      expect(screen.getByText("Job 49")).toBeInTheDocument()
    })

    it("should handle empty array with loading false", () => {
      render(<JobList jobs={[]} isLoading={false} />)

      expect(screen.getByText(/No Jobs found/)).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have accessible loading state", () => {
      render(<JobList jobs={[]} isLoading={true} />)

      const spinner = screen.getByLabelText("Loading Jobs")
      expect(spinner).toHaveAttribute("aria-label", "Loading Jobs")
    })

    it("should have accessible empty state", () => {
      render(<JobList jobs={[]} />)

      const emptyState = screen.getByRole("status")
      expect(emptyState).toBeInTheDocument()
    })

    it("should maintain proper table structure", () => {
      render(<JobList jobs={mockJobs} />)

      const columnHeaders = screen.getAllByRole("columnheader")
      expect(columnHeaders.length).toBeGreaterThan(0)

      const rows = screen.getAllByRole("row")
      expect(rows.length).toBeGreaterThan(1) // At least header + 1 row
    })

    it("should have accessible buttons", () => {
      render(<JobList jobs={mockJobs} />)

      const buttons = screen.getAllByRole("button", { name: "Details" })
      expect(buttons).toHaveLength(mockJobs.length)
    })
  })
})
