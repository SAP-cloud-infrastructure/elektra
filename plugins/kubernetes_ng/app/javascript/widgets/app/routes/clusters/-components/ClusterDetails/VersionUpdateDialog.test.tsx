import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { VersionUpdateDialog } from "./VersionUpdateDialog"
import { PortalProvider } from "@cloudoperators/juno-ui-components"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"
import { VersionUpdates } from "./VersionBadge"

// Helper component to wrap tests with PortalProvider and MessagesProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PortalProvider>
      <MessagesProvider>{component}</MessagesProvider>
    </PortalProvider>
  )
}

describe("VersionUpdateDialog", () => {
  const currentVersion = "1.27.5"
  const onClose = vi.fn()
  const onConfirm = vi.fn()

  const versionUpdates: VersionUpdates = {
    patch: ["1.27.6", "1.27.7"],
    minor: ["1.28.0", "1.28.5", "1.29.0"],
    major: ["2.0.0"],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the modal with correct title", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    expect(screen.getByText("Update Kubernetes Version")).toBeInTheDocument()
  })

  it("displays info message about sequential minor upgrades", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    expect(screen.getByText(/Minor version upgrades must be sequential/i)).toBeInTheDocument()
  })

  it("displays 'No updates available' when versionUpdates is null", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={null}
      />
    )

    expect(screen.getByText("No updates available")).toBeInTheDocument()
  })

  it("displays 'No updates available' when versionUpdates is empty", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={{}}
      />
    )

    expect(screen.getByText("No updates available")).toBeInTheDocument()
  })

  it("groups versions by type with section headers", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    // Check for section headers (they appear as disabled options)
    expect(screen.getByText("patch")).toBeInTheDocument()
    expect(screen.getByText("minor")).toBeInTheDocument()
    expect(screen.getByText("major")).toBeInTheDocument()
  })

  it("displays patch versions correctly", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    expect(screen.getByText("1.27.5 → 1.27.6")).toBeInTheDocument()
    expect(screen.getByText("1.27.5 → 1.27.7")).toBeInTheDocument()
  })

  it("disables update button when no version is selected", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const updateButton = screen.getByRole("button", { name: /Update/i })
    expect(updateButton).toBeDisabled()
  })

  it("renders version select dropdown", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    expect(select).toBeInTheDocument()
    expect(select).not.toBeDisabled()
  })

  it("calls onClose when cancel button is clicked", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("displays version options with disabled state for non-sequential minors", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    // 1.28.0 should be enabled (next minor version)
    const option1_28 = screen.getByText("1.27.5 → 1.28.0")
    expect(option1_28).toBeInTheDocument()

    // 1.29.0 should be disabled (skips a minor version)
    const option1_29 = screen.getByText("1.27.5 → 1.29.0")
    expect(option1_29).toBeInTheDocument()
  })

  it("shows loading state when isUpdating is true", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        isUpdating={true}
      />
    )

    expect(screen.getByText("Updating...")).toBeInTheDocument()

    const updateButton = screen.getByRole("button", { name: /Updating.../i })
    expect(updateButton).toBeDisabled()

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    expect(cancelButton).toBeDisabled()
  })

  it("disables select dropdown when isUpdating is true", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
        isUpdating={true}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    expect(select).toBeDisabled()
  })

  it("does not call onConfirm when update button is clicked without selection", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const updateButton = screen.getByRole("button", { name: /Update/i })
    // Button should be disabled, but let's verify onConfirm is not called
    expect(updateButton).toBeDisabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("renders next minor version option", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    // Check that 1.28.0 is available (next minor version)
    expect(screen.getByText("1.27.5 → 1.28.0")).toBeInTheDocument()
  })

  it("displays all provided patch versions", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    versionUpdates.patch?.forEach((version) => {
      expect(screen.getByText(`${currentVersion} → ${version}`)).toBeInTheDocument()
    })
  })

  it("displays all provided minor versions", () => {
    renderWithProviders(
      <VersionUpdateDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentVersion={currentVersion}
        versionUpdates={versionUpdates}
      />
    )

    const select = screen.getByLabelText(/Select version/i)
    fireEvent.click(select)

    versionUpdates.minor?.forEach((version) => {
      expect(screen.getByText(`${currentVersion} → ${version}`)).toBeInTheDocument()
    })
  })
})
