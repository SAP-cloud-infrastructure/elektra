import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TagPoliciesEditModal from "./edit"

const defaultProps = {
  account: { name: "Test Account" },
  isAdmin: true,
  policies: { isFetching: false, data: [] },
  putAccount: jest.fn(() => Promise.resolve()),
  history: {
    replace: jest.fn(),
  },
}

describe("TagPoliciesEditModal", () => {
  it("renders the modal with initial data", () => {
    render(<TagPoliciesEditModal {...defaultProps} />)
    expect(screen.getByText("Tag Policies for account: Test Account")).not.toBeNull()
  })

  it("add a new policy", async () => {
    const updatedProps = {
      ...defaultProps,
      account: {
        tag_policies: [{ match_repository: ".*", match_tag: ".*", block_delete: true, block_overwrite: true }],
      },
    }
    render(<TagPoliciesEditModal {...updatedProps} />)
    expect(screen.getByTestId("policy:1")).not.toBeNull()
    fireEvent.click(screen.getByText("Add policy"))
    expect(screen.getByTestId("policy:2")).not.toBeNull()

    // configure policy
    expect(screen.queryByTestId("validationText")).toBeNull()
    const select = screen.getAllByTestId("deleteBox")[1]
    fireEvent.change(select, { target: { value: true } })
    const textArea = screen.getAllByTestId("overwriteBox")[1]
    fireEvent.change(textArea, { target: { value: true } })
    expect(screen.queryByTestId("validationText")).toBeNull()

    fireEvent.click(screen.getByText("Save"))
    await waitFor(() => {
      expect(defaultProps.putAccount).toHaveBeenCalled()
    })
  })

  it("displays loading state when policies are fetching", () => {
    const updatedProps = {
      ...defaultProps,
      account: {
        tag_policies: [],
      },
    }
    render(<TagPoliciesEditModal {...updatedProps} />)
    expect(screen.getByText("No entries")).not.toBeNull()
  })
})
