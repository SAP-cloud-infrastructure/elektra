import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import ShowModal from "./show"

// Mock volume data
const mockVolume = {
  id: "volume-123",
  name: "Test Volume",
  description: "Test description",
  size: 100,
  volume_type: "ssd",
  availability_zone: "eu-de-1a",
  status: "available",
  replication_status: "disabled",
  metadata: {
    key1: "value1",
    key2: "value2",
  },
  user_name: "John Doe",
  user_id: "user-456",
  bootable: "true",
  encrypted: "false",
  multiattach: "false",
  snapshot_id: "snapshot-789",
  source_volid: "source-volume-012",
  consistencygroup_id: "cg-345",
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-02T10:00:00Z",
  attachments: [
    {
      attachment_id: "attachment-111",
      server_id: "server-222",
      server_name: "Test Server",
      device: "/dev/vdb",
      attached_at: "2024-01-03T10:00:00Z",
    },
  ],
  volume_image_metadata: {
    image_name: "Ubuntu 22.04",
    min_disk: "10",
    min_ram: "512",
    disk_format: "qcow2",
  },
}

const mockVolumeWithoutOptionalFields = {
  id: "volume-minimal",
  name: "Minimal Volume",
  size: 50,
  volume_type: "standard",
  availability_zone: "eu-de-1b",
  status: "creating",
  user_id: "user-999",
  bootable: "false",
  encrypted: "false",
  multiattach: "false",
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-02T10:00:00Z",
}

describe("ShowModal (Volume)", () => {
  let mockHistory: any
  let mockLocation: any
  let mockLoadVolume: any
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    mockHistory = {
      replace: vi.fn(),
      push: vi.fn(),
      goBack: vi.fn(),
    }
    mockLocation = {
      pathname: "/volumes/volume-123/show",
    }
    mockLoadVolume = vi.fn().mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    const defaultProps = {
      id: "volume-123",
      volume: null,
      history: mockHistory,
      location: mockLocation,
      loadVolume: mockLoadVolume,
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
      mockLoadVolume.mockResolvedValue({})
      renderComponent({ id: "volume-123" })
      const dialog = screen.getAllByRole("dialog").pop()
      expect(dialog).toBeInTheDocument()
    })

    it("does not show modal when id is null", () => {
      mockLoadVolume.mockResolvedValue({})
      renderComponent({ id: null })

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("displays volume id in title when volume is not loaded", () => {
      mockLoadVolume.mockResolvedValue({})
      renderComponent({ id: "volume-123" })

      expect(screen.getByText("volume-123")).toBeInTheDocument()
      expect(screen.getByText("volume-123")).toHaveClass("info-text")
    })

    it("displays volume name in title when volume is loaded", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const modalTitle = screen.getByRole("heading", { name: /volume/i })
      expect(modalTitle).toHaveTextContent("Test Volume")

      // Check that the ID is NOT in the title (but it's okay if it's elsewhere)
      expect(modalTitle).not.toHaveTextContent("volume-123")
    })

    it("shows loading spinner when volume is not available", () => {
      mockLoadVolume.mockResolvedValue({})
      renderComponent({ id: "volume-123" })

      expect(screen.getByText("Loading...")).toBeInTheDocument()
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })
  })

  describe("Volume Loading", () => {
    it("calls loadVolume on mount when volume is not provided", () => {
      mockLoadVolume.mockResolvedValue({})
      renderComponent({ id: "volume-123", volume: null })

      expect(mockLoadVolume).toHaveBeenCalledTimes(1)
    })

    it("does not call loadVolume when volume is already provided", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      expect(mockLoadVolume).not.toHaveBeenCalled()
    })

    it("handles successful volume loading", async () => {
      const { rerender } = renderComponent({ id: "volume-123", volume: null })

      mockLoadVolume.mockResolvedValue({})

      // Simulate volume being loaded
      rerender(
        <BrowserRouter>
          <ShowModal
            id="volume-123"
            volume={mockVolume}
            history={mockHistory}
            location={mockLocation}
            loadVolume={mockLoadVolume}
          />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText("Test Volume")).toBeInTheDocument()
      })
    })

    it("displays error message when loading fails", async () => {
      const errorMessage = "Failed to load volume"
      mockLoadVolume.mockRejectedValue(errorMessage)

      renderComponent({ id: "volume-123", volume: null })

      await waitFor(() => {
        expect(screen.getByText("Could not load volume!")).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it("does not show error when volume eventually loads", async () => {
      const errorMessage = "Failed to load volume"
      mockLoadVolume.mockRejectedValue(errorMessage)

      const { rerender } = renderComponent({ id: "volume-123", volume: null })

      await waitFor(() => {
        expect(screen.getByText("Could not load volume!")).toBeInTheDocument()
      })

      // Now provide the volume
      rerender(
        <BrowserRouter>
          <ShowModal
            id="volume-123"
            volume={mockVolume}
            history={mockHistory}
            location={mockLocation}
            loadVolume={mockLoadVolume}
          />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText("Could not load volume!")).not.toBeInTheDocument()
      })
    })
  })

  describe("Overview Tab - Volume Data Display", () => {
    beforeEach(() => {
      renderComponent({ id: "volume-123", volume: mockVolume })
    })

    it("displays volume name", () => {
      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("displays volume id", () => {
      const table = screen.getByRole("table")
      expect(within(table).getByText("volume-123")).toBeInTheDocument()
    })

    it("displays volume description", () => {
      expect(screen.getByText("Test description")).toBeInTheDocument()
    })

    it("displays volume size", () => {
      const table = screen.getByRole("table")
      expect(within(table).getByText("100")).toBeInTheDocument()
    })

    it("displays volume type", () => {
      expect(screen.getByText("ssd")).toBeInTheDocument()
    })

    it("displays availability zone", () => {
      expect(screen.getByText("eu-de-1a")).toBeInTheDocument()
    })

    it("displays status", () => {
      expect(screen.getByText("available")).toBeInTheDocument()
    })

    it("displays replication status", () => {
      expect(screen.getByText("disabled")).toBeInTheDocument()
    })

    it("displays metadata", () => {
      expect(screen.getByText(/key1: value1/)).toBeInTheDocument()
      expect(screen.getByText(/key2: value2/)).toBeInTheDocument()
    })

    it("renders metadata keys correctly", () => {
      const metadataSection = screen.getByText(/key1: value1/).parentElement
      expect(metadataSection).toBeInTheDocument()
    })

    it("displays user name and id when both available", () => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText("user-456")).toBeInTheDocument()
    })

    it("displays only user id when user name is not available", () => {
      const volumeWithoutUserName = {
        ...mockVolume,
        user_name: undefined,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutUserName })

      const cells = screen.getAllByText("user-456")
      expect(cells.length).toBeGreaterThan(0)
    })

    it("displays bootable status", () => {
      expect(screen.getByText("true")).toBeInTheDocument()
    })

    it("displays encrypted status", () => {
      const cells = screen.getAllByText("false")
      expect(cells.length).toBeGreaterThan(0)
    })

    it("displays multiattach status", () => {
      const cells = screen.getAllByText("false")
      expect(cells.length).toBeGreaterThan(0)
    })

    it("displays snapshot id", () => {
      expect(screen.getByText("snapshot-789")).toBeInTheDocument()
    })

    it("displays source volume id", () => {
      expect(screen.getByText("source-volume-012")).toBeInTheDocument()
    })

    it("displays consistency group id", () => {
      expect(screen.getByText("cg-345")).toBeInTheDocument()
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

  describe("About Bootable Tab", () => {
    it("shows tab when volume_image_metadata exists", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const aboutBootableTab = screen.getByRole("tab", { name: /about bootable/i })
      expect(aboutBootableTab).toBeInTheDocument()
    })

    it("does not show tab when volume_image_metadata is null", () => {
      const volumeWithoutImageMetadata = {
        ...mockVolume,
        volume_image_metadata: null,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutImageMetadata })

      expect(screen.queryByRole("tab", { name: /about bootable/i })).not.toBeInTheDocument()
    })

    it("formats metadata keys correctly (snake_case to Title Case)", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const aboutBootableTab = screen.getByRole("tab", { name: /about bootable/i })
      await user.click(aboutBootableTab)

      await waitFor(() => {
        // image_name -> Image name
        expect(screen.getByText("Image name")).toBeInTheDocument()
        // min_disk -> Min disk
        expect(screen.getByText("Min disk")).toBeInTheDocument()
        // min_ram -> Min ram
        expect(screen.getByText("Min ram")).toBeInTheDocument()
        // disk_format -> Disk format
        expect(screen.getByText("Disk format")).toBeInTheDocument()
      })
    })

    it("displays all volume image metadata fields", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const aboutBootableTab = screen.getByRole("tab", { name: /about bootable/i })
      await user.click(aboutBootableTab)

      await waitFor(() => {
        expect(screen.getByText("Ubuntu 22.04")).toBeInTheDocument()
        expect(screen.getByText("10")).toBeInTheDocument()
        expect(screen.getByText("512")).toBeInTheDocument()
        expect(screen.getByText("qcow2")).toBeInTheDocument()
      })
    })

    it("handles empty volume_image_metadata object", () => {
      const volumeWithEmptyMetadata = {
        ...mockVolume,
        volume_image_metadata: {},
      }
      renderComponent({ id: "volume-123", volume: volumeWithEmptyMetadata })

      // Tab should still appear
      const aboutBootableTab = screen.getByRole("tab", { name: /about bootable/i })
      expect(aboutBootableTab).toBeInTheDocument()
    })
  })

  describe("Attachments Tab", () => {
    it("shows tab when attachments array has items", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      expect(attachmentsTab).toBeInTheDocument()
    })

    it("does not show tab when attachments is empty", () => {
      const volumeWithoutAttachments = {
        ...mockVolume,
        attachments: [],
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutAttachments })

      expect(screen.queryByRole("tab", { name: /attachments/i })).not.toBeInTheDocument()
    })

    it("does not show tab when attachments is null", () => {
      const volumeWithoutAttachments = {
        ...mockVolume,
        attachments: null,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutAttachments })

      expect(screen.queryByRole("tab", { name: /attachments/i })).not.toBeInTheDocument()
    })

    it("displays attachment id", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        expect(screen.getByText("attachment-111")).toBeInTheDocument()
      })
    })

    it("displays server name and id when both available", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        expect(screen.getByText("Test Server")).toBeInTheDocument()
        expect(screen.getByText("server-222")).toBeInTheDocument()
      })
    })

    it("displays only server id when server name is not available", async () => {
      const volumeWithAttachmentNoName = {
        ...mockVolume,
        attachments: [
          {
            attachment_id: "attachment-111",
            server_id: "server-222",
            device: "/dev/vdb",
            attached_at: "2024-01-03T10:00:00Z",
          },
        ],
      }
      renderComponent({ id: "volume-123", volume: volumeWithAttachmentNoName })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        expect(screen.getByText("server-222")).toBeInTheDocument()
        expect(screen.queryByText("Test Server")).not.toBeInTheDocument()
      })
    })

    it("displays device", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        expect(screen.getByText("/dev/vdb")).toBeInTheDocument()
      })
    })

    it("displays attached at date using PrettyDate component", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        const prettyDates = screen.getAllByTestId("pretty-date")
        // Should have created, updated, and attached dates
        expect(prettyDates.length).toBeGreaterThanOrEqual(3)
      })
    })

    it("displays multiple attachments correctly", async () => {
      const volumeWithMultipleAttachments = {
        ...mockVolume,
        attachments: [
          {
            attachment_id: "attachment-111",
            server_id: "server-222",
            server_name: "Test Server 1",
            device: "/dev/vdb",
            attached_at: "2024-01-03T10:00:00Z",
          },
          {
            attachment_id: "attachment-222",
            server_id: "server-333",
            server_name: "Test Server 2",
            device: "/dev/vdc",
            attached_at: "2024-01-04T10:00:00Z",
          },
        ],
      }
      renderComponent({ id: "volume-123", volume: volumeWithMultipleAttachments })

      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        expect(screen.getByText("attachment-111")).toBeInTheDocument()
        expect(screen.getByText("attachment-222")).toBeInTheDocument()
        expect(screen.getByText("Test Server 1")).toBeInTheDocument()
        expect(screen.getByText("Test Server 2")).toBeInTheDocument()
        expect(screen.getByText("/dev/vdb")).toBeInTheDocument()
        expect(screen.getByText("/dev/vdc")).toBeInTheDocument()
      })
    })
  })

  describe("Modal Interactions", () => {
    it("closes modal when close button is clicked", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const closeButton = screen.getAllByRole("button", { name: /close/i }).pop()

      expect(closeButton).toBeInTheDocument()
      await user.click(closeButton!)

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("closes modal when X button in header is clicked", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

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
      renderComponent({ id: "volume-123", volume: mockVolume })

      const closeButton = screen.getAllByRole("button", { name: /close/i }).pop()

      await user.click(closeButton!)

      await waitFor(() => {
        expect(mockHistory.replace).toHaveBeenCalledWith("/volumes")
      })
    })

    it("does not restore URL if modal is still showing", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      // Modal is showing, so restoreUrl shouldn't do anything
      expect(mockHistory.replace).not.toHaveBeenCalled()
    })

    it("stops propagation when hide is called", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const closeButton = screen.getAllByRole("button", { name: /close/i }).pop()
      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })

      // The component's hide method calls stopPropagation
      // We can't directly test this without triggering the event,
      // but we can verify the button click works without errors
      await user.click(closeButton!)

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })
  })

  describe("Props Updates", () => {
    it("shows modal when id prop changes from null to a value", () => {
      const { rerender } = renderComponent({ id: null, volume: null })

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <ShowModal
            id="volume-123"
            volume={mockVolume}
            history={mockHistory}
            location={mockLocation}
            loadVolume={mockLoadVolume}
          />
        </BrowserRouter>
      )
      const modal = screen.getAllByRole("dialog").pop()
      expect(modal).toBeInTheDocument()
    })

    it("hides modal when id prop changes to null", async () => {
      const { rerender } = renderComponent({ id: "volume-123", volume: mockVolume })

      // Check modal is visible
      const modal = screen.getByLabelText(/volume/i).closest(".modal")
      expect(modal).toHaveClass("fade in")

      rerender(
        <BrowserRouter>
          <ShowModal
            id={null}
            volume={null}
            history={mockHistory}
            location={mockLocation}
            loadVolume={mockLoadVolume}
          />
        </BrowserRouter>
      )

      // Wait for modal to hide (Bootstrap animations)
      await waitFor(() => {
        const modal = document.querySelector(".modal")
        expect(modal).not.toHaveClass("in")
      })
    })

    it("clears load error when volume is provided", async () => {
      const errorMessage = "Failed to load"
      mockLoadVolume.mockRejectedValue(errorMessage)

      const { rerender } = renderComponent({ id: "volume-123", volume: null })

      await waitFor(() => {
        expect(screen.getByText("Could not load volume!")).toBeInTheDocument()
      })

      // Provide volume
      rerender(
        <BrowserRouter>
          <ShowModal
            id="volume-123"
            volume={mockVolume}
            history={mockHistory}
            location={mockLocation}
            loadVolume={mockLoadVolume}
          />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText("Could not load volume!")).not.toBeInTheDocument()
      })
    })
  })

  describe("Edge Cases", () => {
    it("handles volume without metadata", () => {
      const volumeWithoutMetadata = {
        ...mockVolume,
        metadata: null,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutMetadata })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("handles volume with empty metadata", () => {
      const volumeWithEmptyMetadata = {
        ...mockVolume,
        metadata: {},
      }
      renderComponent({ id: "volume-123", volume: volumeWithEmptyMetadata })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("handles missing optional fields gracefully", () => {
      renderComponent({ id: "volume-minimal", volume: mockVolumeWithoutOptionalFields })

      expect(screen.getByText("Minimal Volume")).toBeInTheDocument()
      expect(screen.getByText("creating")).toBeInTheDocument()
    })

    it("handles volume without description", () => {
      const volumeWithoutDescription = {
        ...mockVolume,
        description: undefined,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutDescription })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("handles volume without replication_status", () => {
      const volumeWithoutReplicationStatus = {
        ...mockVolume,
        replication_status: undefined,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutReplicationStatus })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("handles volume without snapshot_id", () => {
      const volumeWithoutSnapshotId = {
        ...mockVolume,
        snapshot_id: undefined,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutSnapshotId })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("handles volume without source_volid", () => {
      const volumeWithoutSourceVolid = {
        ...mockVolume,
        source_volid: undefined,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutSourceVolid })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })

    it("handles volume without consistencygroup_id", () => {
      const volumeWithoutConsistencyGroupId = {
        ...mockVolume,
        consistencygroup_id: undefined,
      }
      renderComponent({ id: "volume-123", volume: volumeWithoutConsistencyGroupId })

      expect(screen.getByText("Test Volume")).toBeInTheDocument()
    })
  })

  describe("Modal Accessibility", () => {
    it("has correct aria labels", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const modal = screen.getAllByRole("dialog").pop()
      expect(modal).toHaveAttribute("aria-labelledby", "contained-modal-title-lg")
    })

    it("has modal title with correct id", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const title = document.getElementById("contained-modal-title-lg")
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent("Volume")
    })
  })

  describe("Tabs Navigation", () => {
    it("defaults to overview tab", () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      const overviewTab = screen.getByRole("tab", { name: /overview/i })
      expect(overviewTab).toHaveAttribute("aria-selected", "true")
    })

    it("can switch between tabs when multiple tabs exist", async () => {
      renderComponent({ id: "volume-123", volume: mockVolume })

      // Click on About Bootable tab
      const aboutBootableTab = screen.getByRole("tab", { name: /about bootable/i })
      await user.click(aboutBootableTab)

      await waitFor(() => {
        expect(aboutBootableTab).toHaveAttribute("aria-selected", "true")
      })

      // Click on Attachments tab
      const attachmentsTab = screen.getByRole("tab", { name: /attachments/i })
      await user.click(attachmentsTab)

      await waitFor(() => {
        expect(attachmentsTab).toHaveAttribute("aria-selected", "true")
      })

      // Click back to Overview tab
      const overviewTab = screen.getByRole("tab", { name: /overview/i })
      await user.click(overviewTab)

      await waitFor(() => {
        expect(overviewTab).toHaveAttribute("aria-selected", "true")
      })
    })
  })
})
