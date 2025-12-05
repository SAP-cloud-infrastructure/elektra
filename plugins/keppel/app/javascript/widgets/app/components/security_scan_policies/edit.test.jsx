import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import SecurityScanPoliciesEditModal from "./edit"

const defaultProps = {
  account: { name: "Test Account" },
  isAdmin: true,
  policies: { isFetching: false, data: [] },
  loadPoliciesOnce: vi.fn(),
  putPolicies: vi.fn(() => Promise.resolve()),
  history: {
    replace: vi.fn(),
  },
}

describe("SecurityScanPoliciesEditModal", () => {
  it("renders the modal with initial data", () => {
    render(<SecurityScanPoliciesEditModal {...defaultProps} />)
    expect(screen.getByText("Security Scan Policies for account: Test Account")).not.toBeNull()
  })

  it("add a new policy", async () => {
    const { rerender } = render(<SecurityScanPoliciesEditModal {...defaultProps} />)
    await waitFor(() => {
      expect(defaultProps.loadPoliciesOnce).toHaveBeenCalled()
    })
    const updatedProps = {
      ...defaultProps,
      policies: {
        isFetching: false,
        data: [
          { match_repository: ".*", match_vulnerability_id: ".*", action: { severity: "low", assessment: "example" } },
        ],
      },
    }
    rerender(<SecurityScanPoliciesEditModal {...updatedProps} />)
    expect(screen.getByTestId("policy:1")).not.toBeNull()
    fireEvent.click(screen.getByText("Add policy"))
    expect(screen.getByTestId("policy:2")).not.toBeNull()

    // configure policy
    expect(screen.getByTestId("validationText")).not.toBeNull()
    const select = screen.getAllByTestId("severityBox")[1]
    fireEvent.change(select, { target: { value: "High" } })
    const textArea = screen.getAllByTestId("textArea")[1]
    fireEvent.change(textArea, { target: { value: "example2" } })
    expect(screen.queryByTestId("validationText")).toBeNull()

    fireEvent.click(screen.getByText("Save"))
    await waitFor(() => {
      expect(defaultProps.putPolicies).toHaveBeenCalled()
    })
    
    expect(Object.hasOwn(updatedProps.policies.data[0], "ui_hints")).toBeFalsy()
  })

  it("displays loading state when policies are fetching", () => {
    const fetchingProps = { ...defaultProps, policies: { isFetching: true, data: [] } }
    const { rerender } = render(<SecurityScanPoliciesEditModal {...fetchingProps} />)
    expect(screen.getByText("Loading security scan policy list...")).not.toBeNull()
    const fetchingFinishedProps = { ...fetchingProps, policies: { isFetching: false, data: [] } }
    rerender(<SecurityScanPoliciesEditModal {...fetchingFinishedProps} />)
    expect(screen.getByText("No entries")).not.toBeNull()
  })
})
