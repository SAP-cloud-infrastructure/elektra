import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DeleteDialog from "./DeleteDialog"
import { PortalProvider } from "@cloudoperators/juno-ui-components"

// Helper component to wrap tests with PortalProvider
const renderWithPortal = (component: React.ReactElement) => {
  return render(<PortalProvider>{component}</PortalProvider>)
}

describe("DeleteDialog", () => {
  const clusterName = "test-cluster"
  const onClose = vi.fn()
  const onConfirm = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the modal with correct title and message", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    expect(screen.getByText(`Delete Cluster ${clusterName}`)).toBeInTheDocument()
    expect(screen.getByText(/Destructive action which cannot be undone/i)).toBeInTheDocument()
    expect(screen.getByText(/Type in the name of the cluster to delete/i)).toBeInTheDocument()
  })

  it("renders the input field without errors initially", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const input = screen.getByRole("textbox", { name: /Name/i })
    expect(input).toBeInTheDocument()
    expect(input).not.toHaveClass("juno-textinput-invalid")
  })

  it("renders the input field with invalid state when input is incorrect", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const input = screen.getByRole("textbox", { name: /Name/i })
    fireEvent.change(input, { target: { value: "wrong-name" } })
    expect(input).toHaveClass("juno-textinput-invalid")
  })

  it("disables the confirm button initially", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const confirmButton = screen.getByRole("button", { name: /Confirm Deletion/i })
    expect(confirmButton).toBeDisabled()
  })

  it("enables the confirm button when input matches cluster name", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const input = screen.getByLabelText(/Name/i)
    const confirmButton = screen.getByRole("button", { name: /Confirm Deletion/i })

    fireEvent.change(input, { target: { value: clusterName } })
    expect(confirmButton).not.toBeDisabled()
  })

  it("keeps confirm button disabled when input does not match", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const input = screen.getByLabelText(/Name/i)
    const confirmButton = screen.getByRole("button", { name: /Confirm Deletion/i })

    fireEvent.change(input, { target: { value: "wrong-name" } })
    expect(confirmButton).toBeDisabled()
  })

  it("calls onCancel when cancel button is clicked", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    fireEvent.click(cancelButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onConfirm when confirm button is clicked with valid input", () => {
    renderWithPortal(<DeleteDialog clusterName={clusterName} isOpen={true} onClose={onClose} onConfirm={onConfirm} />)

    const input = screen.getByLabelText(/Name/i)
    const confirmButton = screen.getByRole("button", { name: /Confirm Deletion/i })

    fireEvent.change(input, { target: { value: clusterName } })
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
