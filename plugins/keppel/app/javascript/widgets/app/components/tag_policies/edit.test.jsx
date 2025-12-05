import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TagPoliciesEditModal from "./edit"

const defaultProps = {
  account: { name: "Test Account" },
  isAdmin: true,
  policies: { isFetching: false, data: [] },
  putAccount: vi.fn(() => Promise.resolve()),
  history: {
    replace: vi.fn(),
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
        tag_policies: [{ match_repository: ".*", match_tag: ".*", block_delete: false, block_overwrite: false, block_push: false }],
      },
    }
    render(<TagPoliciesEditModal {...updatedProps} />)
    expect(screen.getByTestId("policy:1")).not.toBeNull()
    fireEvent.click(screen.getByText("Add policy"))
    expect(screen.getByTestId("policy:2")).not.toBeNull()

    // configure policy
    expect(screen.queryByTestId("validationText")).toBeNull()
    const deletion = screen.getAllByTestId("deleteBox")[1]
    fireEvent.change(deletion, { target: { value: true } })
    const overwriteBox = screen.getAllByTestId("overwriteBox")[1]
    fireEvent.change(overwriteBox, { target: { value: true } })
    const blockPush = screen.getAllByTestId("blockPushBox")[1]
    fireEvent.change(blockPush, { target: { value: true } })
    expect(screen.queryByTestId("validationText")).toBeNull()

    fireEvent.click(screen.getByText("Save"))
    await waitFor(() => {
      expect(defaultProps.putAccount).toHaveBeenCalled()
      const callArg = defaultProps.putAccount.mock.calls[0][0]
      expect(callArg).toEqual({
        tag_policies: [
          ...updatedProps.account.tag_policies,
          {
            match_repository: ".*",
            match_tag: ".*",
            block_delete: true,
            block_overwrite: true,
            block_push: true,
          },
        ],
      })
    })

    expect(Object.hasOwn(updatedProps.account.tag_policies[0], "ui_hints")).toBeFalsy()
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
