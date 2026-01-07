import { describe, it, expect } from "vitest"
import { getStatusColor, formatScheduleDate, formatDate } from "./jobUtils"
import { Job } from "../../../../types/api"
import { render } from "@testing-library/react"

describe("jobUtils", () => {
  describe("getStatusColor", () => {
    it.each([
      ["initial", "default"],
      ["scheduled", "info"],
      ["pending", "warning"],
      ["waiting", "warning"],
      ["running", "info"],
      ["successful", "success"],
      ["error", "error"],
      ["reset", "warning"],
      ["canceled", "error"],
      ["unknown-state", "warning"],
    ])('should return "%s" variant for state "%s"', (state, expectedVariant) => {
      expect(getStatusColor(state)).toBe(expectedVariant)
    })
  })

  describe("formatDate", () => {
    it("should format ISO date string to locale string", () => {
      const dateString = "2024-01-15T10:30:00Z"
      const result = formatDate(dateString)

      // Check that it returns a string
      expect(typeof result).toBe("string")

      // Check that it's a valid formatted date (contains expected parts)
      expect(result).toMatch(/2024/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/15/)
    })
  })

  describe("formatScheduleDate", () => {
    const createMockJob = (overrides?: Partial<Job>): Job => ({
      id: "123",
      created_at: "2024-01-01T00:00:00Z",
      name: "Test Job",
      schedule_date: "2024-12-31T23:59:59Z",
      due_date: "2024-12-31T23:59:59Z",
      object_type: "server" as const,
      object_id: "server-123",
      ...overrides,
    })

    it("should return formatted date when schedule_date exists", () => {
      const job = createMockJob({
        schedule_date: "2024-01-15T10:30:00Z",
        due_date: "2025-12-31T23:59:59Z",
      })

      const result = formatScheduleDate(job)

      expect(typeof result).toBe("string")
      expect(result).toMatch(/2024/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/15/)
    })

    it('should show "No schedule date" badge when schedule_date is empty and due_date is in future', () => {
      const job = createMockJob({
        schedule_date: "",
        due_date: "2099-12-31T23:59:59Z",
      })

      const { container } = render(formatScheduleDate(job) as React.ReactElement)

      expect(container.textContent).toContain("No schedule date")
    })

    it('should show "Due date has passed" badge when due_date is in past and no schedule_date', () => {
      const job = createMockJob({
        schedule_date: "",
        due_date: "2020-01-01T00:00:00Z",
      })

      const { container } = render(formatScheduleDate(job) as React.ReactElement)

      expect(container.textContent).toContain("Due date has passed")
    })

    it("should not show any icons in badges", () => {
      const job = createMockJob({
        schedule_date: "",
        due_date: "2099-12-31T23:59:59Z",
      })

      const { container } = render(formatScheduleDate(job) as React.ReactElement)

      // Verify no icons are rendered
      expect(container.querySelector("svg")).toBeFalsy()
      expect(container.querySelector('[title*="Edit"]')).toBeFalsy()
      expect(container.querySelector('[title*="Schedule"]')).toBeFalsy()
    })

    it("should return formatted schedule_date even if due_date has passed", () => {
      const job = createMockJob({
        schedule_date: "2024-01-15T10:30:00Z",
        due_date: "2020-01-01T00:00:00Z",
      })

      const result = formatScheduleDate(job)

      // When schedule_date exists, it should be formatted regardless of due_date
      expect(typeof result).toBe("string")
      expect(result).toMatch(/2024/)
    })

    it('should show "No schedule date" badge when schedule_date is undefined', () => {
      const job = createMockJob({
        schedule_date: undefined as any,
        due_date: "2099-12-31T23:59:59Z",
      })

      const { container } = render(formatScheduleDate(job) as React.ReactElement)

      expect(container.textContent).toContain("No schedule date")
    })

    it('should show "Due date has passed" when both due_date is past and schedule_date is falsy', () => {
      const job = createMockJob({
        schedule_date: undefined as any,
        due_date: "2020-01-01T00:00:00Z",
      })

      const { container } = render(formatScheduleDate(job) as React.ReactElement)

      expect(container.textContent).toContain("Due date has passed")
      expect(container.textContent).not.toContain("No schedule date")
    })

    it("should render Stack component with correct props for warnings", () => {
      const job = createMockJob({
        schedule_date: "",
        due_date: "2099-12-31T23:59:59Z",
      })

      const { container } = render(formatScheduleDate(job) as React.ReactElement)

      // Check that Stack is rendered (it has specific structure)
      expect(container.querySelector('[class*="juno-stack"]')).toBeTruthy()
    })
  })
})
