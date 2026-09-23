import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import RBACPoliciesEditModal from "./edit"

describe("validation_rules tests", () => {
  it("submit a basic form without errors", async () => {
    const putAccount = vi.fn(() => Promise.resolve())
    const history = { replace: vi.fn() }
    // react-bootstrap@0.33 (via react-overlays@0.9.3) logs a legacy
    // childContextTypes deprecation warning under React 19. Ignore that known
    // library warning; it is unrelated to the form submit under test.
    // TODO(react-bootstrap-v2): drop this filter after migrating react-bootstrap.
    const unexpectedErrors = []
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((...args) => {
      const message = args[0]?.toString() || ""
      if (message.includes("childContextTypes") || message.includes("legacy context")) {
        return
      }
      unexpectedErrors.push(args)
    })

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

    expect(unexpectedErrors).toEqual([])
    await waitFor(() => expect(history.replace).toHaveBeenCalledWith("/accounts"))
    consoleErrorSpy.mockRestore()
  })
})
