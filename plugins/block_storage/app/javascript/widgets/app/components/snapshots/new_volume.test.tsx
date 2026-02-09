import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import NewVolumeForm from "./new_volume"

// Mock only react-router-dom history
const mockReplace = vi.fn()

// Wrapper component for router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe("NewVolumeForm Component", () => {
  const mockSnapshot = {
    id: "snap-123",
    name: "test-snapshot",
    volume_id: "vol-456",
  }

  const mockVolume = {
    id: "vol-456",
    name: "test-volume",
    availability_zone: "az-1",
    size: 100,
  }

  const defaultProps = {
    snapshot_id: "snap-123",
    snapshot: mockSnapshot,
    volume: mockVolume,
    loadVolume: vi.fn(),
    handleSubmit: vi.fn(() => Promise.resolve()),
    history: {
      replace: mockReplace,
    } as any,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the modal with correct title", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText("New Volume From Snapshot")).toBeInTheDocument()
  })

  it("renders form with snapshot information", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText("test-snapshot")).toBeInTheDocument()
    expect(screen.getByText(/ID:/)).toBeInTheDocument()

    // Query the specific paragraph element that shows the snapshot info
    const snapshotParagraph = document.querySelector('p[name="snapshot_id"]')
    expect(snapshotParagraph).toBeInTheDocument()
    expect(snapshotParagraph?.textContent).toContain("snap-123")
  })

  it("renders volume information when volume is provided", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText(/test-volume/)).toBeInTheDocument()
    expect(screen.getByText(/Availability Zone:/)).toBeInTheDocument()
    expect(screen.getByText(/az-1/)).toBeInTheDocument()
    expect(screen.getByText(/Size:/)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it("shows snapshot_id when snapshot object is not provided", () => {
    const propsWithoutSnapshot = {
      ...defaultProps,
      snapshot: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutSnapshot} />, { wrapper: RouterWrapper })
    })

    // The snapshot_id should appear directly in the paragraph (not nested in span)
    const snapshotParagraph = document.querySelector('p[name="snapshot_id"]')
    expect(snapshotParagraph).toBeInTheDocument()
    expect(snapshotParagraph?.textContent).toContain("snap-123")
  })

  it("shows volume_id when volume object is not provided but snapshot exists", () => {
    const propsWithoutVolume = {
      ...defaultProps,
      volume: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutVolume} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText(/vol-456/)).toBeInTheDocument()
  })

  it("renders all required form fields", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText("Source Snapshot")).toBeInTheDocument()
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
  })

  it("renders form inputs with correct initial values", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const nameInput = document.getElementById("name") as HTMLInputElement
    const descriptionInput = document.getElementById("description") as HTMLTextAreaElement

    expect(nameInput).toBeInTheDocument()
    expect(descriptionInput).toBeInTheDocument()
    expect(nameInput.value).toBe("vol-test-snapshot")
    expect(descriptionInput.value).toBe("Volume from snapshot test-snapshot")
  })

  it("sets correct initial values when snapshot object is not provided", () => {
    const propsWithoutSnapshot = {
      ...defaultProps,
      snapshot: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutSnapshot} />, { wrapper: RouterWrapper })
    })

    const nameInput = document.getElementById("name") as HTMLInputElement
    const descriptionInput = document.getElementById("description") as HTMLTextAreaElement

    expect(nameInput.value).toBe("vol-snap-123")
    expect(descriptionInput.value).toBe("Volume from snapshot snap-123")
  })

  it("renders cancel and submit buttons", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("calls loadVolume on mount when volume is not provided", () => {
    const propsWithoutVolume = {
      ...defaultProps,
      volume: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutVolume} />, { wrapper: RouterWrapper })
    })

    expect(defaultProps.loadVolume).toHaveBeenCalledWith("vol-456")
  })

  it("does not call loadVolume when volume is already provided", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(defaultProps.loadVolume).not.toHaveBeenCalled()
  })

  it("does not call loadVolume when snapshot is not provided", () => {
    const propsWithoutSnapshot = {
      ...defaultProps,
      snapshot: null,
      volume: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutSnapshot} />, { wrapper: RouterWrapper })
    })

    expect(defaultProps.loadVolume).not.toHaveBeenCalled()
  })

  it("allows user to type in name field", async () => {
    const user = userEvent.setup()

    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const nameInput = document.getElementById("name") as HTMLInputElement

    await act(async () => {
      await user.clear(nameInput)
      await user.type(nameInput, "my-new-volume")
    })

    expect(nameInput.value).toBe("my-new-volume")
  })

  it("allows user to type in description field", async () => {
    const user = userEvent.setup()

    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const descriptionInput = document.getElementById("description") as HTMLTextAreaElement

    await act(async () => {
      await user.clear(descriptionInput)
      await user.type(descriptionInput, "My new description")
    })

    expect(descriptionInput.value).toBe("My new description")
  })

  it("calls handleSubmit with form values on submit", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn(() => Promise.resolve())
    const props = {
      ...defaultProps,
      handleSubmit,
    }

    act(() => {
      render(<NewVolumeForm {...props} />, { wrapper: RouterWrapper })
    })

    const nameInput = document.getElementById("name") as HTMLInputElement
    const descriptionInput = document.getElementById("description") as HTMLTextAreaElement
    const submitButton = screen.getByRole("button", { name: "Save" })

    await act(async () => {
      await user.clear(nameInput)
      await user.type(nameInput, "new-volume")
      await user.clear(descriptionInput)
      await user.type(descriptionInput, "new description")
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "new-volume",
          description: "new description",
        })
      )
    })
  })

  it("closes modal after successful submit", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn(() => Promise.resolve())
    const props = {
      ...defaultProps,
      handleSubmit,
    }

    act(() => {
      render(<NewVolumeForm {...props} />, { wrapper: RouterWrapper })
    })

    const submitButton = screen.getByRole("button", { name: "Save" })

    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      const modal = document.querySelector(".modal")
      expect(modal).not.toHaveClass("in")
    })
  })

  it("modal closes when cancel button is clicked", async () => {
    const user = userEvent.setup()

    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const cancelButton = screen.getByRole("button", { name: "Cancel" })

    // Modal should be visible initially
    const modal = document.querySelector(".modal")
    expect(modal).toHaveClass("in")

    await act(async () => {
      await user.click(cancelButton)
    })

    await waitFor(() => {
      const modal = document.querySelector(".modal")
      expect(modal).not.toHaveClass("in")
    })
  })

  it("redirects to snapshots after modal exits", async () => {
    const user = userEvent.setup()

    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const cancelButton = screen.getByRole("button", { name: "Cancel" })

    await act(async () => {
      await user.click(cancelButton)
    })

    // Wait for the modal to close and trigger onExited
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith("/snapshots")
      },
      { timeout: 3000 }
    )
  })

  it("does not show source volume section when both volume and snapshot are missing", () => {
    const propsWithoutBoth = {
      ...defaultProps,
      snapshot: null,
      volume: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutBoth} />, { wrapper: RouterWrapper })
    })

    expect(screen.queryByText(/Source Volume:/)).not.toBeInTheDocument()
  })

  it("shows source volume section when snapshot exists but volume is missing", () => {
    const propsWithoutVolume = {
      ...defaultProps,
      volume: null,
    }

    act(() => {
      render(<NewVolumeForm {...propsWithoutVolume} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText(/Source Volume:/)).toBeInTheDocument()
    expect(screen.getByText(/vol-456/)).toBeInTheDocument()
  })

  it("shows source volume section when volume exists", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    expect(screen.getByText(/Source Volume:/)).toBeInTheDocument()
    expect(screen.getByText(/test-volume/)).toBeInTheDocument()
  })

  it("renders required field markers", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    // Check for required class on labels
    const labels = document.querySelectorAll("label.required")
    expect(labels.length).toBeGreaterThan(0)

    // Check for abbr elements indicating required fields
    const abbrs = document.querySelectorAll("abbr[title='required']")
    expect(abbrs.length).toBe(3) // snapshot_id, name, description
  })

  it("has correct form structure", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const form = document.querySelector("form")
    expect(form).toBeInTheDocument()
    expect(form).toHaveClass("form", "form-horizontal")
  })

  it("displays snapshot ID in info text", () => {
    act(() => {
      render(<NewVolumeForm {...defaultProps} />, { wrapper: RouterWrapper })
    })

    const infoTexts = document.querySelectorAll(".info-text")
    expect(infoTexts.length).toBeGreaterThan(0)

    // Check that snap-123 appears in an info-text span
    const hasSnapshotId = Array.from(infoTexts).some((el) => el.textContent?.replace(/\s+/g, " ").includes("snap-123"))
    expect(hasSnapshotId).toBe(true)
  })

  it("handles submission error gracefully", async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn(() => Promise.reject(new Error("Submit failed")))
    const props = {
      ...defaultProps,
      handleSubmit,
    }

    act(() => {
      render(<NewVolumeForm {...props} />, { wrapper: RouterWrapper })
    })

    const submitButton = screen.getByRole("button", { name: "Save" })

    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    })

    // Modal should still be open after error
    expect(screen.getByText("New Volume From Snapshot")).toBeInTheDocument()
  })
})
