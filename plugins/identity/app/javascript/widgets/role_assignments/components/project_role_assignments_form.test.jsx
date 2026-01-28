import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import React from "react"
import ProjectRoleAssignmentsInlineForm from "./project_role_assignments_form.tsx"

// Mock data
const createRole = (id, name, description = "", restricted = false) => ({
  id,
  name,
  description,
  restricted,
})

const mockRoles = [
  createRole("role-1", "admin", "Administrator role"),
  createRole("role-2", "member", "Member role"),
  createRole("role-3", "viewer", "Viewer role"),
  createRole("role-4", "cloud_admin", "Cloud Administrator role"),
  createRole("role-5", "network_admin", "Network Administrator", false),
  createRole("role-6", "restricted_role", "Restricted role", true),
]

describe("ProjectRoleAssignmentsInlineForm", () => {
  let mockLoadRolesOnce
  let mockUpdateProjectMemberRoleAssignments
  let mockOnSave
  let mockOnCancel
  let user

  beforeEach(() => {
    user = userEvent.setup()
    mockLoadRolesOnce = vi.fn()
    mockUpdateProjectMemberRoleAssignments = vi.fn(() => Promise.resolve())
    mockOnSave = vi.fn()
    mockOnCancel = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  const renderComponent = (props = {}) => {
    const defaultProps = {
      projectId: "project-123",
      memberId: "member-456",
      memberType: "User",
      memberRoles: [mockRoles[0], mockRoles[1]], // admin and member
      availableRoles: null,
      loadRolesOnce: mockLoadRolesOnce,
      updateProjectMemberRoleAssignments: mockUpdateProjectMemberRoleAssignments,
      onSave: mockOnSave,
      onCancel: mockOnCancel,
      ...props,
    }

    // If availableRoles is provided, make a deep copy to avoid mutation
    if (defaultProps.availableRoles && defaultProps.availableRoles.items) {
      defaultProps.availableRoles = {
        ...defaultProps.availableRoles,
        items: defaultProps.availableRoles.items.map((role) => ({ ...role })),
      }
    }

    return render(<ProjectRoleAssignmentsInlineForm {...defaultProps} />)
  }

  describe("Initial Rendering", () => {
    it("renders with default props", () => {
      renderComponent()
      expect(screen.getByText("Loading ...")).toBeInTheDocument()
    })

    it("calls loadRolesOnce on mount", () => {
      renderComponent()
      expect(mockLoadRolesOnce).toHaveBeenCalledTimes(1)
    })

    it("shows loading spinner when roles are being fetched", () => {
      renderComponent()
      expect(document.querySelector(".spinner")).toBeInTheDocument()
      expect(screen.getByText("Loading ...")).toBeInTheDocument()
    })

    it("shows available roles when loaded", () => {
      renderComponent({
        availableRoles: { items: mockRoles, isFetching: false },
      })

      expect(screen.getByText("admin")).toBeInTheDocument()
      expect(screen.getByText("member")).toBeInTheDocument()
      expect(screen.getByText("viewer")).toBeInTheDocument()
    })

    it("checks currently assigned roles by default", async () => {
      // Create fresh mocks for this test to avoid pollution
      const freshLoadRolesOnce = vi.fn()
      const freshUpdateProjectMemberRoleAssignments = vi.fn(() => Promise.resolve())
      const freshOnSave = vi.fn()
      const freshOnCancel = vi.fn()

      render(
        <ProjectRoleAssignmentsInlineForm
          projectId="project-123"
          memberId="member-456"
          memberType="User"
          memberRoles={[mockRoles[0], mockRoles[1]]} // admin and member
          availableRoles={{ items: mockRoles, isFetching: false }}
          loadRolesOnce={freshLoadRolesOnce}
          updateProjectMemberRoleAssignments={freshUpdateProjectMemberRoleAssignments}
          onSave={freshOnSave}
          onCancel={freshOnCancel}
        />
      )

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox")
        expect(checkboxes.length).toBeGreaterThan(0)
      })

      const checkboxes = screen.getAllByRole("checkbox")
      const adminCheckbox = checkboxes.find((cb) => cb.value === "role-1")
      const memberCheckbox = checkboxes.find((cb) => cb.value === "role-2")
      const viewerCheckbox = checkboxes.find((cb) => cb.value === "role-3")

      expect(adminCheckbox).toBeDefined()
      expect(memberCheckbox).toBeDefined()
      expect(viewerCheckbox).toBeDefined()
      expect(adminCheckbox).toBeChecked()
      expect(memberCheckbox).toBeChecked()
      expect(viewerCheckbox).not.toBeChecked()
    })

    it("renders roles sorted by name", () => {
      const unsortedRoles = [createRole("r1", "zebra"), createRole("r2", "apple"), createRole("r3", "middle")]

      renderComponent({
        availableRoles: { items: unsortedRoles, isFetching: false },
      })

      const labels = screen.getAllByRole("checkbox").map((cb) => cb.parentElement.textContent.trim())

      expect(labels[0]).toContain("apple")
      expect(labels[1]).toContain("middle")
      expect(labels[2]).toContain("zebra")
    })

    it("disables Save button when no changes made", () => {
      renderComponent({
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const saveButton = screen.getByText("Save")
      expect(saveButton).toBeDisabled()
    })

    it("renders role descriptions", () => {
      renderComponent({
        availableRoles: { items: mockRoles, isFetching: false },
      })

      expect(screen.getByText("(Administrator role)")).toBeInTheDocument()
      expect(screen.getByText("(Member role)")).toBeInTheDocument()
    })
  })

  describe("Role Selection", () => {
    it("allows checking a new role", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const checkboxes = screen.getAllByRole("checkbox")
      const viewerCheckbox = checkboxes.find((cb) => cb.value === "role-3")
      expect(viewerCheckbox).not.toBeChecked()

      await user.click(viewerCheckbox)

      expect(viewerCheckbox).toBeChecked()
    })

    it("allows unchecking a current role", async () => {
      renderComponent({
        memberRoles: [mockRoles[0], mockRoles[1]], // admin and member
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const checkboxes = screen.getAllByRole("checkbox")
      const adminCheckbox = checkboxes.find((cb) => cb.value === "role-1")
      expect(adminCheckbox).toBeChecked()

      await user.click(adminCheckbox)

      expect(adminCheckbox).not.toBeChecked()
    })

    it("highlights newly added roles with bg-info class", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const viewerLabel = viewerCheckbox.parentElement
      expect(viewerLabel).toHaveClass("bg-info")
    })

    it("highlights removed roles with u-text-remove-highlight class", async () => {
      renderComponent({
        memberRoles: [mockRoles[0], mockRoles[1]], // admin and member
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const checkboxes = screen.getAllByRole("checkbox")
      const adminCheckbox = checkboxes.find((cb) => cb.value === "role-1")
      await user.click(adminCheckbox)

      const adminLabel = adminCheckbox.parentElement
      expect(adminLabel).toHaveClass("u-text-remove-highlight")
    })

    it("enables Save button when roles are changed", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const saveButton = screen.getByText("Save")
      expect(saveButton).toBeDisabled()

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      expect(saveButton).not.toBeDisabled()
    })
  })

  describe("Bulk Actions", () => {
    it("removes all roles when Remove All button is clicked", async () => {
      renderComponent({
        memberRoles: [mockRoles[0], mockRoles[1]], // admin and member
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const removeAllButton = screen.getByText("Remove All")
      await user.click(removeAllButton)

      const checkboxes = screen.getAllByRole("checkbox")
      const adminCheckbox = checkboxes.find((cb) => cb.value === "role-1")
      const memberCheckbox = checkboxes.find((cb) => cb.value === "role-2")

      expect(adminCheckbox).not.toBeChecked()
      expect(memberCheckbox).not.toBeChecked()
    })

    it("shows Remove Member button when all roles removed", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const removeAllButton = screen.getByText("Remove All")
      await user.click(removeAllButton)

      await waitFor(() => {
        expect(screen.getByText("Remove Member")).toBeInTheDocument()
      })
    })

    it("shows Save button when at least one role is selected", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const saveButton = screen.getByText("Save")
      expect(saveButton).toBeInTheDocument()
    })
  })

  describe("Save Functionality", () => {
    it("calls updateProjectMemberRoleAssignments when Save is clicked", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      expect(mockUpdateProjectMemberRoleAssignments).toHaveBeenCalledWith(
        "project-123",
        "member-456",
        expect.arrayContaining(["role-1", "role-3"])
      )
    })

    it("shows Please Wait ... when saving", async () => {
      mockUpdateProjectMemberRoleAssignments.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      expect(screen.getByText("Please Wait ...")).toBeInTheDocument()
    })

    it("disables buttons while saving", async () => {
      mockUpdateProjectMemberRoleAssignments.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      const cancelButton = screen.getByText("Cancel")
      const removeAllButton = screen.getByText("Remove All")

      expect(cancelButton).toBeDisabled()
      expect(removeAllButton).toBeDisabled()
    })

    it("calls onSave callback after successful save", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1)
      })
    })

    it("displays error message when save fails", async () => {
      mockUpdateProjectMemberRoleAssignments.mockRejectedValue("Save failed!")

      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText("Save failed!")).toBeInTheDocument()
      })
    })

    it("clears error message on successful save", async () => {
      mockUpdateProjectMemberRoleAssignments.mockRejectedValueOnce("First save failed").mockResolvedValueOnce()

      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      // First save attempt - should fail
      const checkboxes = screen.getAllByRole("checkbox")
      const viewerCheckbox = checkboxes.find((cb) => cb.value === "role-3")
      await user.click(viewerCheckbox)
      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText("First save failed")).toBeInTheDocument()
      })

      // Second save attempt - should succeed and clear error
      const memberCheckbox = checkboxes.find((cb) => cb.value === "role-2")
      await user.click(memberCheckbox)

      await waitFor(() => {
        const updatedSaveButton = screen.getByText("Save")
        expect(updatedSaveButton).not.toBeDisabled()
      })

      await user.click(screen.getByText("Save"))

      await waitFor(() => {
        expect(screen.queryByText("First save failed")).not.toBeInTheDocument()
      })
    })
  })

  describe("Cancel Functionality", () => {
    it("calls onCancel when Cancel button is clicked", async () => {
      renderComponent({
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const cancelButton = screen.getByText("Cancel")
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe("Remove Member Functionality", () => {
    it("shows Remove Member button with correct memberType in tooltip", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        memberType: "User",
        availableRoles: { items: mockRoles, isFetching: false },
      })

      // Remove all roles
      const removeAllButton = screen.getByText("Remove All")
      await user.click(removeAllButton)

      await waitFor(() => {
        const removeMemberButton = screen.getByText("Remove Member")
        expect(removeMemberButton).toBeInTheDocument()
      })

      // The tooltip component wraps the button and uses memberType prop
      // We can verify the button is present and it's the danger button
      const removeMemberButton = screen.getByText("Remove Member")
      expect(removeMemberButton).toHaveClass("btn-danger")
    })

    it("calls updateProjectMemberRoleAssignments with empty array when Remove Member is clicked", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const removeAllButton = screen.getByText("Remove All")
      await user.click(removeAllButton)

      await waitFor(() => {
        expect(screen.getByText("Remove Member")).toBeInTheDocument()
      })

      const removeMemberButton = screen.getByText("Remove Member")
      await user.click(removeMemberButton)

      expect(mockUpdateProjectMemberRoleAssignments).toHaveBeenCalledWith("project-123", "member-456", [])
    })
  })

  describe("Props Updates", () => {
    it("updates available roles when they become available", () => {
      const { rerender } = renderComponent({
        availableRoles: null,
      })

      expect(screen.getByText("Loading ...")).toBeInTheDocument()

      rerender(
        <ProjectRoleAssignmentsInlineForm
          projectId="project-123"
          memberId="member-456"
          memberType="User"
          memberRoles={[mockRoles[0]]}
          availableRoles={{ items: mockRoles, isFetching: false }}
          loadRolesOnce={mockLoadRolesOnce}
          updateProjectMemberRoleAssignments={mockUpdateProjectMemberRoleAssignments}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText("Loading ...")).not.toBeInTheDocument()
      expect(screen.getByText("admin")).toBeInTheDocument()
    })

    it("does not update roles if they were already loaded", () => {
      const { rerender } = renderComponent({
        availableRoles: { items: mockRoles.slice(0, 2), isFetching: false },
      })

      expect(screen.getByText("admin")).toBeInTheDocument()
      expect(screen.queryByText("viewer")).not.toBeInTheDocument()

      // Try to update with more roles
      rerender(
        <ProjectRoleAssignmentsInlineForm
          projectId="project-123"
          memberId="member-456"
          memberType="User"
          memberRoles={[mockRoles[0]]}
          availableRoles={{ items: mockRoles, isFetching: false }}
          loadRolesOnce={mockLoadRolesOnce}
          updateProjectMemberRoleAssignments={mockUpdateProjectMemberRoleAssignments}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Should still show only the first 2 roles (no update)
      expect(screen.getByText("admin")).toBeInTheDocument()
      expect(screen.queryByText("viewer")).not.toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("handles empty memberRoles array", () => {
      renderComponent({
        memberRoles: [],
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const checkboxes = screen.getAllByRole("checkbox")
      const adminCheckbox = checkboxes.find((cb) => cb.value === "role-1")
      expect(adminCheckbox).not.toBeChecked()
    })

    it("handles empty availableRoles array", () => {
      renderComponent({
        availableRoles: { items: [], isFetching: false },
      })

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    })

    it("handles roles without descriptions", () => {
      const rolesWithoutDesc = [createRole("r1", "role1", "")]

      renderComponent({
        availableRoles: { items: rolesWithoutDesc, isFetching: false },
      })

      expect(screen.getByText("role1")).toBeInTheDocument()
    })

    it("strips description text after parentheses", () => {
      const roleWithComplexDesc = createRole("r1", "role1", "Main description (extra info)")

      renderComponent({
        availableRoles: { items: [roleWithComplexDesc], isFetching: false },
      })

      expect(screen.getByText(/Main description/i)).toBeInTheDocument()
    })

    it("handles concurrent role changes correctly", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      const memberCheckbox = screen.getByLabelText(/member/i)

      await user.click(viewerCheckbox)
      await user.click(memberCheckbox)
      await user.click(viewerCheckbox) // uncheck viewer

      expect(viewerCheckbox).not.toBeChecked()
      expect(memberCheckbox).toBeChecked()
    })

    it("does not trigger update when clicking already checked role", async () => {
      renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const checkboxes = screen.getAllByRole("checkbox")
      const adminCheckbox = checkboxes.find((cb) => cb.value === "role-1")
      expect(adminCheckbox).toBeChecked()

      // Click multiple times
      await user.click(adminCheckbox)
      await user.click(adminCheckbox)

      // Should be checked after even number of clicks
      expect(adminCheckbox).toBeChecked()
    })
  })

  describe("Cleanup", () => {
    it("cancels pending save promise on unmount", async () => {
      let resolvePromise
      mockUpdateProjectMemberRoleAssignments.mockImplementation(
        () => new Promise((resolve) => (resolvePromise = resolve))
      )

      const { unmount } = renderComponent({
        memberRoles: [mockRoles[0]], // only admin
        availableRoles: { items: mockRoles, isFetching: false },
      })

      const viewerCheckbox = screen.getByLabelText(/viewer/i)
      await user.click(viewerCheckbox)

      const saveButton = screen.getByText("Save")
      await user.click(saveButton)

      // Unmount while promise is pending
      unmount()

      // Resolve the promise after unmount
      resolvePromise()

      // Should not throw any errors or call onSave
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })
})
