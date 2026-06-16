import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { JobDetails } from "./JobDetails"
import { Job } from "../../../types/api"
import { AjaxHelper } from "lib/ajax_helper"

describe("JobDetails", () => {
  // Helper functions to generate dynamic dates
  const getPastDate = (daysAgo = 1) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString()
  }

  const getFutureDate = (daysAhead = 1) => {
    const date = new Date()
    date.setDate(date.getDate() + daysAhead)
    return date.toISOString()
  }

  const getNextYear = () => {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString()
  }

  const createMockJob = (overrides?: Partial<Job>): Job => ({
    id: "job-123",
    created_at: getPastDate(365),
    name: "Test Job",
    description: "Test job description",
    state: "scheduled",
    schedule_date: getFutureDate(7),
    due_date: getNextYear(),
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
        due_date: getPastDate(365),
        schedule_date: "",
      })
      render(<JobDetails job={job} />)

      expect(screen.getByText("Job missed its scheduled time and can no longer be scheduled")).toBeInTheDocument()
    })

    it("should show error when job was scheduled but not successful before due date", () => {
      const job = createMockJob({
        due_date: getPastDate(365),
        schedule_date: getPastDate(380),
        state: "error",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.getByText("Job was scheduled but did not complete successfully before due date!")
      ).toBeInTheDocument()
    })

    it("should not show error when job is successful even if past due date", () => {
      const job = createMockJob({
        due_date: getPastDate(365),
        schedule_date: getPastDate(380),
        state: "successful",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.queryByText("Job was scheduled but did not complete successfully before due date!")
      ).not.toBeInTheDocument()
    })

    it("should render DateTimePicker when job state is scheduled", () => {
      const today = new Date()
      const testDueDate = new Date(today.setDate(today.getDate() + 10)).toISOString()
      const job = createMockJob({
        due_date: testDueDate,
        schedule_date: "",
        state: "scheduled",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      expect(screen.getByText("Select the date and time to schedule the job.")).toBeInTheDocument()
    })

    it("should render DateTimePicker when job state is initial", () => {
      const today = new Date()
      const testDueDate = new Date(today.setDate(today.getDate() + 10)).toISOString()
      const job = createMockJob({
        due_date: testDueDate,
        schedule_date: "",
        state: "initial",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      expect(screen.getByText("Select the date and time to schedule the job.")).toBeInTheDocument()
    })

    it("should show formatted schedule date when job state is successful", () => {
      const scheduleDate = getFutureDate(7)
      const job = createMockJob({
        state: "successful",
        schedule_date: scheduleDate,
      })
      render(<JobDetails job={job} />)

      const expectedDate = new Date(scheduleDate).toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })

    it("should show formatted schedule date when job state is failed", () => {
      const scheduleDate = getFutureDate(7)
      const job = createMockJob({
        state: "failed",
        schedule_date: scheduleDate,
      })
      render(<JobDetails job={job} />)

      const expectedDate = new Date(scheduleDate).toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })

    it("should show formatted schedule date when job state is error", () => {
      const scheduleDate = getFutureDate(7)
      const job = createMockJob({
        state: "error",
        schedule_date: scheduleDate,
      })
      render(<JobDetails job={job} />)

      const expectedDate = new Date(scheduleDate).toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })

    it("should show formatted due_date when it exists", () => {
      const dueDate = getFutureDate(30)
      const job = createMockJob({
        due_date: dueDate,
      })
      render(<JobDetails job={job} />)

      const expectedDate = new Date(dueDate).toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  describe("Form submission", () => {
    it("should successfully update job schedule date when state is scheduled", async () => {
      const apiClient = createMockApiClient()
      const scheduleDate = getFutureDate(7)
      const patchMock = vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          success: true,
        },
      } as any)

      const job = createMockJob({
        schedule_date: scheduleDate,
        state: "scheduled",
      })
      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).not.toBeDisabled()

      fireEvent.click(scheduleButton)

      await waitFor(
        () => {
          expect(patchMock).toHaveBeenCalledTimes(1)
          expect(patchMock).toHaveBeenCalledWith("/jobs/job-123", expect.objectContaining({
            schedule_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          }))
        },
        { timeout: 3000 }
      )

      await waitFor(() => {
        expect(screen.getByText("Job updated successfully!")).toBeInTheDocument()
      })
    })

    it("should successfully update job schedule date when state is initial", async () => {
      const apiClient = createMockApiClient()
      const scheduleDate = getFutureDate(7)
      const patchMock = vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          success: true,
        },
      } as any)

      const job = createMockJob({
        schedule_date: scheduleDate,
        state: "initial",
      })
      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).not.toBeDisabled()

      fireEvent.click(scheduleButton)

      await waitFor(
        () => {
          expect(patchMock).toHaveBeenCalledTimes(1)
          expect(patchMock).toHaveBeenCalledWith("/jobs/job-123", expect.objectContaining({
            schedule_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          }))
        },
        { timeout: 3000 }
      )

      await waitFor(() => {
        expect(screen.getByText("Job updated successfully!")).toBeInTheDocument()
      })
    })

    it("should show error when API client is undefined", async () => {
      const job = createMockJob({
        state: "scheduled",
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
          error: "Invalid date format",
        },
      } as any)

      const job = createMockJob({
        state: "scheduled",
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
      const error = new Error("Bad request: Invalid schedule date")
      vi.mocked(apiClient.patch).mockRejectedValueOnce(error)

      const job = createMockJob({
        state: "scheduled",
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
        state: "scheduled",
      })
      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      fireEvent.click(scheduleButton)

      await waitFor(() => {
        expect(scheduleButton).toBeDisabled()
      })
    })

    it("should disable button when no schedule date is set", () => {
      const job = createMockJob({
        schedule_date: "",
        state: "initial",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).toBeDisabled()
    })

    it("should show loading state during submission", async () => {
      const apiClient = createMockApiClient()
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(apiClient.patch).mockReturnValueOnce(promise as any)

      const job = createMockJob({
        state: "scheduled",
      })
      render(<JobDetails job={job} apiClient={apiClient} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      fireEvent.click(scheduleButton)

      await waitFor(() => {
        expect(scheduleButton).toBeDisabled()
      })

      resolvePromise!({ data: { success: true } })

      await waitFor(() => {
        expect(screen.getByText("Job updated successfully!")).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(scheduleButton).not.toBeDisabled()
      })
    })
  })

  describe("DateTimePicker validation", () => {
    it("should render with valid future date - button enabled for scheduled state", () => {
      const job = createMockJob({
        state: "scheduled",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).not.toBeDisabled()
    })

    it("should render with valid future date - button enabled for initial state", () => {
      const job = createMockJob({
        state: "initial",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).not.toBeDisabled()
    })

    it("should render with no schedule date - button disabled", () => {
      const job = createMockJob({
        schedule_date: "",
        state: "initial",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const scheduleButton = screen.getByRole("button", { name: /schedule/i })
      expect(scheduleButton).toBeDisabled()
    })

    it("should NOT render DateTimePicker for successful state", () => {
      const job = createMockJob({
        state: "successful",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      expect(screen.queryByText("Select the date and time to schedule the job.")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /schedule/i })).not.toBeInTheDocument()
    })

    it("should NOT render DateTimePicker for failed state", () => {
      const job = createMockJob({
        state: "failed",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      expect(screen.queryByText("Select the date and time to schedule the job.")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /schedule/i })).not.toBeInTheDocument()
    })

    it("should NOT render DateTimePicker for error state", () => {
      const job = createMockJob({
        state: "error",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      expect(screen.queryByText("Select the date and time to schedule the job.")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /schedule/i })).not.toBeInTheDocument()
    })

    it("should display correct helptext with due date", () => {
      const dueDate = getNextYear()
      const job = createMockJob({
        due_date: dueDate,
        schedule_date: "",
        state: "initial",
      })
      render(<JobDetails job={job} apiClient={createMockApiClient()} />)

      const formattedDueDate = new Date(dueDate).toLocaleDateString()
      expect(
        screen.getByText(new RegExp(`Schedule Date not later as for job due by ${formattedDueDate}`, "i"))
      ).toBeInTheDocument()
    })
  })

  describe("Schedule date validation messages", () => {
    it("should show error when schedule date is in past and job state is scheduled", () => {
      const job = createMockJob({
        schedule_date: getPastDate(1),
        state: "scheduled",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.getByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).toBeInTheDocument()
    })

    it("should show error when schedule date is in past and job state is initial", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)

      const job = createMockJob({
        schedule_date: yesterday.toISOString(),
        state: "initial",
        due_date: nextYear.toISOString(),
      })
      render(<JobDetails job={job} />)

      expect(
        screen.getByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).toBeInTheDocument()
    })

    it("should show error when schedule date is in past and job state is error", () => {
      const job = createMockJob({
        schedule_date: getPastDate(1),
        state: "error",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.getByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).toBeInTheDocument()
    })

    it("should NOT show error when schedule date is in past but job state is successful", () => {
      const job = createMockJob({
        schedule_date: getPastDate(1),
        state: "successful",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.queryByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).not.toBeInTheDocument()
    })

    it("should NOT show error when schedule date is in past but job state is failed", () => {
      const job = createMockJob({
        schedule_date: getPastDate(1),
        state: "failed",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.queryByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).not.toBeInTheDocument()
    })

    it("should NOT show error when schedule date is in future", () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const job = createMockJob({
        schedule_date: tomorrow.toISOString(),
        state: "scheduled",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.queryByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).not.toBeInTheDocument()
    })

    it("should NOT show error when schedule date is empty", () => {
      const job = createMockJob({
        schedule_date: "",
        state: "initial",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.queryByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).not.toBeInTheDocument()
    })

    it("should show error with multiple conditions met - past schedule date and non-terminal state", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const job = createMockJob({
        schedule_date: yesterday.toISOString(),
        state: "scheduled",
      })
      render(<JobDetails job={job} />)

      expect(
        screen.getByText("The task is not done and the Schedule date is in the past, please check the task status!")
      ).toBeInTheDocument()
    })
  })
})
