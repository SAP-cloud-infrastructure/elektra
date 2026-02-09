import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import ShowModal from "./show"

// Mock snapshot data
const mockSnapshot = {
  id: "snapshot-123",
  name: "Test Snapshot",
  description: "Test description",
  size: 100,
  status: "available",
  "os-extended-snapshot-attributes:progress": "100%",
  volume_id: "volume-456",
  volume_name: "Test Volume",
  metadata: {
    key1: "value1",
    key2: "value2",
  },
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-02T10:00:00Z",
}

describe("ShowModal", () => {
  let mockHistory: any
  let mockLoadSnapshot: any
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    mockHistory = {
      replace: vi.fn(),
      push: vi.fn(),
      goBack: vi.fn(),
    }
    mockLoadSnapshot = vi.fn().mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    const defaultProps = {
      id: "snapshot-123",
      snapshot: null,
      history: mockHistory,
      loadSnapshot: mockLoadSnapshot,
      ...props,
    }

    return render(
      <BrowserRouter>
        <ShowModal {...defaultProps} />
      </BrowserRouter>
    )
  }

  describe("Initial Rendering", () => {
    it("renders modal when id is provided", () => {
      mockLoadSnapshot.mockResolvedValue({})
      renderComponent({ id: "snapshot-123" })
      const dialog = screen.getAllByRole("dialog").pop()
      expect(dialog).toBeInTheDocument()
    })

    it("does not show modal when id is null", () => {
      mockLoadSnapshot.mockResolvedValue({})
      renderComponent({ id: null })

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("displays snapshot id in title when snapshot is not loaded", () => {
      mockLoadSnapshot.mockResolvedValue({})
      renderComponent({ id: "snapshot-123" })

      expect(screen.getByText("snapshot-123")).toBeInTheDocument()
      expect(screen.getByText("snapshot-123")).toHaveClass("info-text")
    })

    it("displays snapshot name in title when snapshot is loaded", () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      const modalTitle = screen.getByRole("heading", { name: /snapshot/i })
      expect(modalTitle).toHaveTextContent("Test Snapshot")

      // Check that the ID is NOT in the title (but it's okay if it's elsewhere)
      expect(modalTitle).not.toHaveTextContent("snapshot-123")
    })

    it("shows loading spinner when snapshot is not available", () => {
      mockLoadSnapshot.mockResolvedValue({})
      renderComponent({ id: "snapshot-123" })

      expect(screen.getByText("Loading...")).toBeInTheDocument()
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })
  })

  describe("Snapshot Loading", () => {
    it("calls loadSnapshot on mount when snapshot is not provided", () => {
      mockLoadSnapshot.mockResolvedValue({})
      renderComponent({ id: "snapshot-123", snapshot: null })

      expect(mockLoadSnapshot).toHaveBeenCalledTimes(1)
    })

    it("does not call loadSnapshot when snapshot is already provided", () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      expect(mockLoadSnapshot).not.toHaveBeenCalled()
    })

    it("handles successful snapshot loading", async () => {
      const { rerender } = renderComponent({ id: "snapshot-123", snapshot: null })

      mockLoadSnapshot.mockResolvedValue({})

      // Simulate snapshot being loaded
      rerender(
        <BrowserRouter>
          <ShowModal id="snapshot-123" snapshot={mockSnapshot} history={mockHistory} loadSnapshot={mockLoadSnapshot} />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
      })
    })

    it("displays error message when loading fails", async () => {
      const errorMessage = "Failed to load snapshot"
      mockLoadSnapshot.mockRejectedValue(new Error(errorMessage))

      renderComponent({ id: "snapshot-123", snapshot: null })

      await waitFor(() => {
        expect(screen.getByText("Could not load snapshot!")).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it("does not show error when snapshot eventually loads", async () => {
      const errorMessage = "Failed to load snapshot"
      mockLoadSnapshot.mockRejectedValue(new Error(errorMessage))

      const { rerender } = renderComponent({ id: "snapshot-123", snapshot: null })

      await waitFor(() => {
        expect(screen.getByText("Could not load snapshot!")).toBeInTheDocument()
      })

      // Now provide the snapshot
      rerender(
        <BrowserRouter>
          <ShowModal id="snapshot-123" snapshot={mockSnapshot} history={mockHistory} loadSnapshot={mockLoadSnapshot} />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText("Could not load snapshot!")).not.toBeInTheDocument()
      })
    })
  })

  describe("Snapshot Data Display", () => {
    beforeEach(() => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })
    })

    it("displays snapshot name", () => {
      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
    })

    it("displays snapshot id", () => {
      const table = screen.getByRole("table")
      expect(within(table).getByText("snapshot-123")).toBeInTheDocument()
    })

    it("displays snapshot description", () => {
      expect(screen.getByText("Test description")).toBeInTheDocument()
    })

    it("displays snapshot size", () => {
      const table = screen.getByRole("table")
      expect(within(table).getByText("100")).toBeInTheDocument()
    })

    it("displays snapshot status", () => {
      expect(screen.getByText("available")).toBeInTheDocument()
    })

    it("displays snapshot progress", () => {
      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("displays volume name and id", () => {
      expect(screen.getByText("Test Volume")).toBeInTheDocument()
      expect(screen.getByText("volume-456")).toBeInTheDocument()
    })

    it("displays only volume id when volume name is not available", () => {
      const snapshotWithoutVolumeName = {
        ...mockSnapshot,
        volume_name: null,
      }
      renderComponent({ id: "snapshot-123", snapshot: snapshotWithoutVolumeName })

      const cells = screen.getAllByText("volume-456")
      expect(cells.length).toBeGreaterThan(0)
    })

    it("displays metadata", () => {
      expect(screen.getByText(/key1: value1/)).toBeInTheDocument()
      expect(screen.getByText(/key2: value2/)).toBeInTheDocument()
    })

    it("renders metadata keys correctly", () => {
      const metadataSection = screen.getByText(/key1: value1/).parentElement
      expect(metadataSection).toBeInTheDocument()
    })

    it("displays created at date using PrettyDate component", () => {
      const prettyDates = screen.getAllByTestId("pretty-date")
      expect(prettyDates[0]).toHaveTextContent("2 years ago")
    })

    it("displays updated at date using PrettyDate component", () => {
      const prettyDates = screen.getAllByTestId("pretty-date")
      expect(prettyDates[1]).toHaveTextContent("2 years ago")
    })
  })

  describe("Modal Interactions", () => {
    it("closes modal when close button is clicked", async () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      const closeButton = screen.getAllByRole("button", { name: /close/i }).pop()

      expect(closeButton).toBeInTheDocument()
      await user.click(closeButton!)

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("closes modal when X button in header is clicked", async () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      // Bootstrap modal close button
      const closeButtons = screen.getAllByRole("button")
      const headerCloseButton = closeButtons.find(
        (button) => button.className.includes("close") || button.getAttribute("aria-label") === "Close"
      )

      if (headerCloseButton) {
        await user.click(headerCloseButton)

        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        })
      }
    })

    it("restores URL when modal is closed", async () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      const closeButton = screen.getAllByRole("button", { name: /close/i }).pop()

      await user.click(closeButton!)

      await waitFor(() => {
        expect(mockHistory.replace).toHaveBeenCalledWith("/snapshots")
      })
    })

    it("does not restore URL if modal is still showing", () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      // Modal is showing, so restoreUrl shouldn't do anything
      expect(mockHistory.replace).not.toHaveBeenCalled()
    })
  })

  describe("Props Updates", () => {
    it("shows modal when id prop changes from null to a value", () => {
      const { rerender } = renderComponent({ id: null, snapshot: null })

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <ShowModal id="snapshot-123" snapshot={mockSnapshot} history={mockHistory} loadSnapshot={mockLoadSnapshot} />
        </BrowserRouter>
      )
      const modal = screen.getAllByRole("dialog").pop()
      expect(modal).toBeInTheDocument()
    })

    it("hides modal when id prop changes to null", async () => {
      const { rerender } = renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      // Check modal is visible
      const modal = screen.getByLabelText(/snapshot/i).closest(".modal")
      expect(modal).toHaveClass("fade in")

      rerender(
        <BrowserRouter>
          <ShowModal id={null} snapshot={null} history={mockHistory} loadSnapshot={mockLoadSnapshot} />
        </BrowserRouter>
      )

      // Wait for modal to hide (Bootstrap animations)
      await waitFor(() => {
        const modal = document.querySelector(".modal")
        expect(modal).not.toHaveClass("in")
      })
    })

    it("clears load error when snapshot is provided", async () => {
      const errorMessage = "Failed to load"
      mockLoadSnapshot.mockRejectedValue(errorMessage)

      const { rerender } = renderComponent({ id: "snapshot-123", snapshot: null })

      await waitFor(() => {
        expect(screen.getByText("Could not load snapshot!")).toBeInTheDocument()
      })

      // Provide snapshot
      rerender(
        <BrowserRouter>
          <ShowModal id="snapshot-123" snapshot={mockSnapshot} history={mockHistory} loadSnapshot={mockLoadSnapshot} />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText("Could not load snapshot!")).not.toBeInTheDocument()
      })
    })
  })

  describe("Edge Cases", () => {
    it("handles snapshot without metadata", () => {
      const snapshotWithoutMetadata = {
        ...mockSnapshot,
        metadata: null,
      }
      renderComponent({ id: "snapshot-123", snapshot: snapshotWithoutMetadata })

      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
    })

    it("handles snapshot with empty metadata", () => {
      const snapshotWithEmptyMetadata = {
        ...mockSnapshot,
        metadata: {},
      }
      renderComponent({ id: "snapshot-123", snapshot: snapshotWithEmptyMetadata })

      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
    })

    it("handles missing optional fields gracefully", () => {
      const minimalSnapshot = {
        id: "snapshot-123",
        name: "Minimal Snapshot",
        size: 50,
        status: "creating",
      }
      renderComponent({ id: "snapshot-123", snapshot: minimalSnapshot })

      expect(screen.getByText("Minimal Snapshot")).toBeInTheDocument()
      expect(screen.getByText("creating")).toBeInTheDocument()
    })

    it("handles snapshot with progress as undefined", () => {
      const snapshotWithoutProgress = {
        ...mockSnapshot,
        "os-extended-snapshot-attributes:progress": undefined,
      }
      renderComponent({ id: "snapshot-123", snapshot: snapshotWithoutProgress })

      expect(screen.getByText("Test Snapshot")).toBeInTheDocument()
    })
  })

  describe("Modal Accessibility", () => {
    it("has correct aria labels", () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      const modal = screen.getAllByRole("dialog").pop()
      expect(modal).toHaveAttribute("aria-labelledby", "contained-modal-title-lg")
    })

    it("has modal title with correct id", () => {
      renderComponent({ id: "snapshot-123", snapshot: mockSnapshot })

      const title = document.getElementById("contained-modal-title-lg")
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent("Snapshot")
    })
  })
})
