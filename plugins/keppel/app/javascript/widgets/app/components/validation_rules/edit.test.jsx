import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RBACPoliciesEditModal from "./edit"

describe("validation_rules tests", () => {
  it("submit a basic form without errors", async () => {
    const putAccount = vi.fn(() => Promise.resolve())
    const history = { replace: vi.fn() }
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const account = {
      validation: { rule_for_manifest: "rule" },
    }

    render(<RBACPoliciesEditModal account={account} isAdmin={true} putAccount={putAccount} history={history} />)

    act(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      userEvent.click(saveButton)
    })

    await waitFor(() => expect(putAccount).toHaveBeenCalledTimes(1))
    const callArg = putAccount.mock.calls[0][0]
    expect(callArg).toEqual({
      ...account,
    })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    await waitFor(() => expect(history.replace).toHaveBeenCalledWith("/accounts"))
  })
})
