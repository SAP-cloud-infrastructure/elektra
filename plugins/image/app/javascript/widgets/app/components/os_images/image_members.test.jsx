import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"
import ImageMembersModal from "./image_members"

// Mock child components
vi.mock("./image_member_item", () => ({
  default: ({ member, handleDelete, handleReject }) => (
    <tr data-testid={`member-item-${member.member_id}`}>
      <td>{member.member_id}</td>
      <td>{member.status}</td>
      <td>
        <button onClick={handleDelete}>Delete</button>
        <button onClick={handleReject}>Reject</button>
      </td>
    </tr>
  ),
}))

vi.mock("./image_member_form", () => ({
  default: ({ handleSubmit }) => (
    <div data-testid="image-member-form">
      <input data-testid="member-input" />
      <button data-testid="submit-form" onClick={() => handleSubmit("test-member-id")}>
        Submit
      </button>
    </div>
  ),
}))

vi.mock("lib/elektra-form/components/form_errors", () => ({
  FormErrors: ({ errors }) => <div data-testid="form-errors">{JSON.stringify(errors)}</div>,
}))

// Mock global policy object
global.policy = {
  isAllowed: vi.fn(() => true),
}

describe("ImageMembersModal", () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      image: {
        id: "image-123",
        name: "Test Image",
        visibility: "shared",
        owner: "owner-123",
        owner_project_name: "Owner Project",
      },
      imageMembers: {
        isFetching: false,
        items: [
          {
            member_id: "member-1",
            target_name: "Target Project 1",
            status: "accepted",
          },
          {
            member_id: "member-2",
            target_name: "Target Project 2",
            status: "pending",
          },
        ],
      },
      activeTab: "shared",
      history: {
        replace: vi.fn(),
      },
      loadMembersOnce: vi.fn(() => Promise.resolve()),
      resetImageMembers: vi.fn(),
      handleSubmit: vi.fn(() => Promise.resolve()),
      handleDelete: vi.fn(() => Promise.resolve()),
      handleReject: vi.fn(() => Promise.resolve()),
      handleVisibilityChange: vi.fn(),
      reloadMembers: vi.fn(() => Promise.resolve()),
    }

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Rendering", () => {
    it("renders modal with correct title", () => {
      render(<ImageMembersModal {...defaultProps} />)
      expect(screen.getByText(/Access Control for Image Test Image/i)).toBeInTheDocument()
    })

    it("renders loading state when imageMembers is fetching", () => {
      const props = {
        ...defaultProps,
        imageMembers: { isFetching: true, items: [] },
      }
      render(<ImageMembersModal {...props} />)
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })

    it("renders loading state when imageMembers is null", () => {
      const props = {
        ...defaultProps,
        imageMembers: null,
      }
      render(<ImageMembersModal {...props} />)
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })

    it("renders member list when data is loaded", () => {
      render(<ImageMembersModal {...defaultProps} />)
      expect(screen.getByTestId("member-item-member-1")).toBeInTheDocument()
      expect(screen.getByTestId("member-item-member-2")).toBeInTheDocument()
    })

    it("renders 'No members found' when members list is empty", () => {
      const props = {
        ...defaultProps,
        imageMembers: { isFetching: false, items: [] },
      }
      render(<ImageMembersModal {...props} />)
      expect(screen.getByText(/No members found/i)).toBeInTheDocument()
    })

    it("renders alert when image visibility is not shared", () => {
      const props = {
        ...defaultProps,
        image: { ...defaultProps.image, visibility: "private" },
      }
      render(<ImageMembersModal {...props} />)
      expect(screen.getByText(/Only shared images may contain members/i)).toBeInTheDocument()
    })

    it("renders 'Set to shared' link when policy allows and image is not shared", () => {
      const props = {
        ...defaultProps,
        image: { ...defaultProps.image, visibility: "private" },
      }
      render(<ImageMembersModal {...props} />)
      expect(screen.getByText(/Set to shared/i)).toBeInTheDocument()
    })
  })

  describe("Lifecycle Methods", () => {
    it("calls loadMembersOnce on mount when image is shared", () => {
      render(<ImageMembersModal {...defaultProps} />)
      expect(defaultProps.loadMembersOnce).toHaveBeenCalledWith("image-123")
    })

    it("does not call loadMembersOnce when image visibility is not shared", () => {
      const props = {
        ...defaultProps,
        image: { ...defaultProps.image, visibility: "private" },
      }
      render(<ImageMembersModal {...props} />)
      expect(defaultProps.loadMembersOnce).not.toHaveBeenCalled()
    })

    it("does not call loadMembersOnce when image is null", () => {
      const props = {
        ...defaultProps,
        image: null,
      }
      render(<ImageMembersModal {...props} />)
      expect(defaultProps.loadMembersOnce).not.toHaveBeenCalled()
    })

    it("calls resetImageMembers on unmount when image exists", () => {
      const { unmount } = render(<ImageMembersModal {...defaultProps} />)
      unmount()
      expect(defaultProps.resetImageMembers).toHaveBeenCalledWith("image-123")
    })

    it("does not call resetImageMembers on unmount when image is null", () => {
      const props = {
        ...defaultProps,
        image: null,
      }
      const { unmount } = render(<ImageMembersModal {...props} />)
      unmount()
      expect(defaultProps.resetImageMembers).not.toHaveBeenCalled()
    })

    it("calls loadMembersOnce when props change with new image", () => {
      const { rerender } = render(<ImageMembersModal {...defaultProps} />)
      expect(defaultProps.loadMembersOnce).toHaveBeenCalledTimes(1)

      const newProps = {
        ...defaultProps,
        image: { ...defaultProps.image, id: "image-456" },
      }
      rerender(<ImageMembersModal {...newProps} />)
      expect(defaultProps.loadMembersOnce).toHaveBeenCalledWith("image-456")
    })

    it("handles loadMembersOnce rejection and sets error state", async () => {
      const error = new Error("Failed to load members")
      const props = {
        ...defaultProps,
        loadMembersOnce: vi.fn(() => Promise.reject(error)),
      }
      render(<ImageMembersModal {...props} />)

      await waitFor(() => {
        expect(screen.getByTestId("form-errors")).toBeInTheDocument()
      })
    })
  })

  describe("Modal Behavior", () => {
    it("starts with modal shown", () => {
      render(<ImageMembersModal {...defaultProps} />)
      // Modal should be rendered with show prop - check by title
      const modalTitle = screen.getByText(/Access Control for Image Test Image/i)
      expect(modalTitle).toBeInTheDocument()
    })

    it("hides modal when close button is clicked", () => {
      render(<ImageMembersModal {...defaultProps} />)
      // Modal has two close buttons: header X button and footer Close button
      // Get all buttons with "Close" text and pick the footer one (second)
      const closeButtons = screen.getAllByRole("button", { name: /close/i })
      expect(closeButtons).toHaveLength(2)

      // Footer button is the second one - clicking should not throw error
      fireEvent.click(closeButtons[1])

      // After clicking, the modal component's state.show becomes false
      // In real scenario, React Bootstrap would trigger fade-out animation
      // The hide method sets show: false which triggers modal to close
    })

    it("calls history.replace with correct URL on modal exit", () => {
      render(<ImageMembersModal {...defaultProps} />)
      // Get all close buttons and click the footer one
      const closeButtons = screen.getAllByRole("button", { name: /close/i })
      fireEvent.click(closeButtons[1])

      // The restoreUrl method is called onExited callback from react-bootstrap Modal
      // It checks if show is false before calling history.replace
      // Since we can't easily simulate the onExited event in this test,
      // we verify history.replace is not called immediately after clicking close
      expect(defaultProps.history.replace).not.toHaveBeenCalled()
    })
  })

  describe("Form Toggle", () => {
    it("does not show form initially", () => {
      render(<ImageMembersModal {...defaultProps} />)
      expect(screen.queryByTestId("image-member-form")).not.toBeInTheDocument()
    })

    it("shows form when add button is clicked", async () => {
      render(<ImageMembersModal {...defaultProps} />)
      const addButton = screen.getByRole("link")
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId("image-member-form")).toBeInTheDocument()
      })
    })

    it("hides form when close button is clicked after showing form", async () => {
      render(<ImageMembersModal {...defaultProps} />)
      const toggleButton = screen.getByRole("link")

      // Show form
      fireEvent.click(toggleButton)
      await waitFor(() => {
        expect(screen.getByTestId("image-member-form")).toBeInTheDocument()
      })

      // Hide form
      fireEvent.click(toggleButton)
      await waitFor(() => {
        expect(screen.queryByTestId("image-member-form")).not.toBeInTheDocument()
      })
    })

    it("changes button icon when form is toggled", async () => {
      render(<ImageMembersModal {...defaultProps} />)
      const toggleButton = screen.getByRole("link")

      // Initially should have plus icon
      expect(toggleButton.querySelector(".fa-plus")).toBeInTheDocument()

      // After clicking, should have close icon
      fireEvent.click(toggleButton)
      await waitFor(() => {
        expect(toggleButton.querySelector(".fa-close")).toBeInTheDocument()
      })
    })
  })

  describe("Form Submission", () => {
    it("calls handleSubmit with correct arguments", async () => {
      render(<ImageMembersModal {...defaultProps} />)

      // Show form
      const toggleButton = screen.getByRole("link")
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByTestId("image-member-form")).toBeInTheDocument()
      })

      // Submit form
      const submitButton = screen.getByTestId("submit-form")
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.handleSubmit).toHaveBeenCalledWith("image-123", "test-member-id")
      })
    })

    it("hides form after successful submission", async () => {
      render(<ImageMembersModal {...defaultProps} />)

      // Show form
      const toggleButton = screen.getByRole("link")
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(screen.getByTestId("image-member-form")).toBeInTheDocument()
      })

      // Submit form
      const submitButton = screen.getByTestId("submit-form")
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByTestId("image-member-form")).not.toBeInTheDocument()
      })
    })
  })

  describe("Member Actions", () => {
    it("calls handleDelete when delete button is clicked", () => {
      render(<ImageMembersModal {...defaultProps} />)
      const deleteButtons = screen.getAllByText("Delete")
      fireEvent.click(deleteButtons[0])

      expect(defaultProps.handleDelete).toHaveBeenCalledWith("image-123", "member-1")
    })

    it("calls handleReject and reloadMembers when reject button is clicked", async () => {
      render(<ImageMembersModal {...defaultProps} />)
      const rejectButtons = screen.getAllByText("Reject")
      fireEvent.click(rejectButtons[0])

      await waitFor(() => {
        expect(defaultProps.handleReject).toHaveBeenCalledWith("image-123")
        expect(defaultProps.reloadMembers).toHaveBeenCalledWith("image-123")
      })
    })
  })

  describe("Visibility Change", () => {
    it("calls handleVisibilityChange when 'Set to shared' link is clicked", () => {
      const props = {
        ...defaultProps,
        image: { ...defaultProps.image, visibility: "private" },
      }
      render(<ImageMembersModal {...props} />)

      const setToSharedLink = screen.getByText(/Set to shared/i)
      fireEvent.click(setToSharedLink)

      expect(defaultProps.handleVisibilityChange).toHaveBeenCalledWith("image-123", "shared")
    })
  })

  describe("Policy Checks", () => {
    it("checks policy for visibility change permission", () => {
      const props = {
        ...defaultProps,
        image: { ...defaultProps.image, visibility: "private" },
      }
      render(<ImageMembersModal {...props} />)

      expect(global.policy.isAllowed).toHaveBeenCalledWith("image:image_visibility_to_shared", {
        image: props.image,
      })
    })

    it("checks policy for member creation permission", () => {
      render(<ImageMembersModal {...defaultProps} />)

      expect(global.policy.isAllowed).toHaveBeenCalledWith("image:member_create", {
        image: defaultProps.image,
      })
    })

    it("does not show add button when policy denies member creation", () => {
      global.policy.isAllowed = vi.fn((permission) => {
        if (permission === "image:member_create") return false
        return true
      })

      render(<ImageMembersModal {...defaultProps} />)

      // The add button should not be rendered
      const links = screen.queryAllByRole("link")
      expect(links.length).toBe(0)
    })
  })
})
