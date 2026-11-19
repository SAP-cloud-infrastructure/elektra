import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "./queryKeys"
import { buildResetStatusMutationOptions } from "./useResetInstanceStatusMutation"

describe("reset status mutation", () => {
  it("fires resetStatus and invalidates both keys on settle", async () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const resetStatus = vi.fn().mockResolvedValue(undefined)
    const api = { instances: { resetStatus } } as never
    const opts = buildResetStatusMutationOptions(api, qc)

    await opts.mutationFn!({ id: "s1", state: "active" })
    expect(resetStatus).toHaveBeenCalledWith("s1", "active")

    opts.onSettled!(undefined, null, { id: "s1", state: "active" }, undefined)
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
