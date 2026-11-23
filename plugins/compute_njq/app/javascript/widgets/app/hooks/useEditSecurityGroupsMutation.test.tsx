import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { buildEditSecurityGroupsMutationOptions } from "./useEditSecurityGroupsMutation"
import { QUERY_KEYS } from "./queryKeys"
import type { ComputeApi } from "../apiClient"

const api = { instances: { setSecurityGroups: vi.fn().mockResolvedValue(undefined) } } as unknown as ComputeApi

describe("buildEditSecurityGroupsMutationOptions", () => {
  it("calls the apiClient with the security_groups body", async () => {
    const qc = new QueryClient()
    const opts = buildEditSecurityGroupsMutationOptions(api, qc)
    await opts.mutationFn!({ id: "s1", security_groups: ["sg-a", "sg-b"] })
    expect(api.instances.setSecurityGroups).toHaveBeenCalledWith("s1", {
      security_groups: ["sg-a", "sg-b"],
    })
  })

  it("invalidates the instances list and the instance detail on settle", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const opts = buildEditSecurityGroupsMutationOptions(api, qc)
    opts.onSettled!(undefined, null, { id: "s1", security_groups: ["sg-a"] }, undefined)
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
