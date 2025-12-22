// components/JobDetails.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { JobDetails } from "./JobDetails"
import { Job } from "../../../types/api"
import { AjaxHelper } from "lib/ajax_helper"

// Mock the jobUtils
vi.mock("./utils/jobUtils", () => ({
  getStatusColor: vi.fn((state: string) => {
    const colors: Record<string, string> = {
      initial: "info",
      scheduled: "info",
      successful: "success",
      error: "error",
      unknown: "warning",
    }
    return colors[state] || "warning"
  }),
  formatDate: vi.fn((dateString: string) => new Date(dateString).toLocaleString()),
  formatScheduleDate: vi.fn((job: Job) => job.schedule_date || "No schedule date"),
}))

describe("JobDetails", () => {
  const createMockJob = (overrides?: Partial<Job>): Job => ({
    id: "job-123",
    created_at: "2024-01-01T00:00:00Z",
    name: "Test Job",
    description: "Test job description",
    state: "scheduled",
    schedule_date: "2026-06-15T10:00:00Z", // Future date
    due_date: "2026-12-31T23:59:59Z", // Future date
    object_type: "server",
    object_id: "server-123",
    ...overrides,
  })

  const createMockApiClient = () => {
    return {
      patch: vi.fn(),
    } as unknown as AjaxHelper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Basic rendering", () => {
    it("should render job details correctly", () => {
      const job = createMockJob()
      render(<JobDetails job={job} />)

      expect(screen.getByText("ID")).toBeInTheDocument()
      expect(screen.getByText("job-123")).toBeInTheDocument()
      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Test Job")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
      expect(screen.getByText("scheduled")).toBeInTheDocument()
      expect(screen.getByText("Description")).toBeInTheDocument()
      expect(screen.getByText("Test job description")).toBeInTheDocument()
    })

    it('should render "No description" when description is missing', () => {
      const job = createMockJob({ description: undefined })
      render(<JobDetails job={job} />)

      expect(screen.getByText("No description")).toBeInTheDocument()
    })

    it('should render "No due date!!!" when due_date is missing', () => {
      const job = createMockJob({ due_date: "" })
      render(<JobDetails job={job} />)

      expect(screen.getByText("No due date!!!")).toBeInTheDocument()
    })

    it('should render "No type" when object_type is missing', () => {
      const job = createMockJob({ object_type: undefined as any })
      render(<JobDetails job={job} />)

      expect(screen.getByText("No type")).toBeInTheDocument()
    })

    it('should render "No object" when object_id is missing', () => {
      const job = createMockJob({ object_id: "" })
      render(<JobDetails job={job} />)

      expect(screen.getByText("No object")).toBeInTheDocument()
    })

    it('should render "unknown" status when state is missing', () => {
      const job = createMockJob({ state: undefined })
      render(<JobDetails job={job} />)

      expect(screen.getByText("unknown")).toBeInTheDocument()
    })
  })

  describe("Object link rendering", () => {
    it('should render "Jump to" link for server type with domain and project', () => {
      const job = createMockJob({ object_type: "server", object_id: "server-123" })
      render(<JobDetails job={job} domainName="test-domain" projectName="test-project" />)

      expect(screen.getByText("Jump to")).toBeInTheDocument()
      const link = screen.getByRole("link")
      expect(link).toHaveAttribute("href", "/test-domain/test-project/compute/instances?overlay=server-123")
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    })

    it("should render only object_id when object_type is not server", () => {
      const job = createMockJob({ object_type: "network", object_id: "network-123" })
      render(<JobDetails job={job} domainName="test-domain" projectName="test-project" />)

      expect(screen.queryByText("Jump to")).not.toBeInTheDocument()
      expect(screen.getByText("network-123")).toBeInTheDocument()
    })

    it("should render only object_id when domainName or projectName is missing", () => {
      const job = createMockJob({ object_type: "server", object_id: "server-123" })
      render(<JobDetails job={job} />)

      expect(screen.queryByText("Jump to")).not.toBeInTheDocument()
      expect(screen.getByText("server-123")).toBeInTheDocument()
    })
  })

  describe("Schedule date handling", () => {
    it("should show error message when job missed scheduled time", () => {
      const job = createMockJob({
        due_date: "2020-01-01T00:00:00Z",
        schedule_date: "",
      })
      render(<JobDetails job={job} />)

      expect(screen.getByText("Job missed its scheduled time and can no longer be scheduled")).toBeInTheDocument()
    })

    it("should show error when job was scheduled but not successful before due date", () => {
      const job = createMockJob({
        due_date: "2020-01-01T00:00:00Z",
        schedule_date: "2019-12-15T00:00:00Z",
        state: "error",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.getByText("Job was scheduled but did not complete successfully before due date!")
      ).toBeInTheDocument()
    })

    it("should not show error when job is successful even if past due date", () => {
      const job = createMockJob({
        due_date: "2020-01-01T00:00:00Z",
        schedule_date: "2019-12-15T00:00:00Z",
        state: "successful",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.queryByText("Job was scheduled but did not complete successfully before due date!")
      ).not.toBeInTheDocument()
    })

    it("should render DateTimePicker when job can be scheduled", () => {
      const job = createMockJob({
        due_date: "2025-12-31T23:59:59Z",
        schedule_date: "",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      expect(screen.getByText("Select the date and time to schedule the job.")).toBeInTheDocument()
    })
  })

  describe("Form submission", () => {
    it("should successfully update job schedule date", async () => {
      const apiClient = createMockApiClient()

      // Mock returns the response with data wrapper
      const patchMock = vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          success: true,
        },
      } as any)

      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })

      // Verify button is not disabled
      expect(scheduleButton).not.toBeDisabled()

      // Use fireEvent for the click
      fireEvent.click(scheduleButton)

      // First verify the API was called
      await waitFor(
        () => {
          expect(patchMock).toHaveBeenCalledTimes(1)
          expect(patchMock).toHaveBeenCalledWith("/jobs/job-123", {
            schedule_date: "2026-06-15T10:00:00.000Z",
          })
        },
        { timeout: 3000 }
      )

      // Then verify the success message appears
      await waitFor(() => {
        expect(screen.getByText("Job updated successfully!")).toBeInTheDocument()
      })
    })

    it("should show error when API client is undefined", async () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={undefined} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })

      fireEvent.click(scheduleButton)

      await waitFor(() => {
        expect(screen.getByText("API client is undefined")).toBeInTheDocument()
      })
    })

    it("should show error when API returns error response", async () => {
      const apiClient = createMockApiClient()

      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          success: false,
          error: {
            type: "API_ERROR",
            message: "Invalid date format",
            backtrace: [],
          },
        },
      } as any)

      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      fireEvent.click(scheduleButton)

      await waitFor(() => {
        expect(screen.getByText("Invalid date format")).toBeInTheDocument()
      })
    })

    it("should handle 400 error from API", async () => {
      const apiClient = createMockApiClient()

      vi.mocked(apiClient.patch).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              type: "API_ERROR",
              message: "Bad request: Invalid schedule date",
              backtrace: [],
            },
          },
        },
      })

      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      fireEvent.click(scheduleButton)

      await waitFor(() => {
        expect(screen.getByText("Bad request: Invalid schedule date")).toBeInTheDocument()
      })
    })

    it("should disable button when loading", async () => {
      const apiClient = createMockApiClient()
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          success: true,
        },
      } as any)
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })
      render(<JobDetails job={job} apiClient={apiClient} />)
      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      // Click the button
      fireEvent.click(scheduleButton)
      // Button should be disabled while loading
      await waitFor(() => {
        expect(scheduleButton).toBeDisabled()
      })
    })

    it("should disable button when no schedule date is set", () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "",
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).toBeDisabled()
    })

    it("should disable button when schedule date is in the past", () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2020-06-15T10:00:00Z", // Past date
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })

      // Button should be disabled because date is in the past
      expect(scheduleButton).toBeDisabled()
    })

    it("should show loading state during submission", async () => {
      const apiClient = createMockApiClient()

      // Create a deferred promise
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(apiClient.patch).mockReturnValueOnce(promise as any)

      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })

      fireEvent.click(scheduleButton)

      // Button should be disabled while loading
      await waitFor(() => {
        expect(scheduleButton).toBeDisabled()
      })

      // Resolve the promise
      resolvePromise!({ data: { success: true } })

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText("Job updated successfully!")).toBeInTheDocument()
      })

      // Button should be enabled again
      await waitFor(() => {
        expect(scheduleButton).not.toBeDisabled()
      })
    })
  })

  describe("DateTimePicker validation", () => {
    it("should render with valid future date - button enabled", () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2026-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).not.toBeDisabled()
    })

    it("should render with past date - button disabled", () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "2020-06-15T10:00:00Z",
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).toBeDisabled()
    })

    it("should render with date after due date - button disabled", () => {
      const job = createMockJob({
        due_date: "2026-06-01T00:00:00Z",
        schedule_date: "2026-12-31T23:59:59Z",
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).toBeDisabled()
    })

    it("should render with no schedule date - button disabled", () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "",
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).toBeDisabled()
    })

    it("should display correct helptext with due date", () => {
      const job = createMockJob({
        due_date: "2026-12-31T23:59:59Z",
        schedule_date: "",
      })

      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const dueDate = new Date("2026-12-31T23:59:59Z").toLocaleDateString()
      expect(
        screen.getByText(new RegExp(`Schedule Date not later as for job due by ${dueDate}`, "i"))
      ).toBeInTheDocument()
    })
  })
})
