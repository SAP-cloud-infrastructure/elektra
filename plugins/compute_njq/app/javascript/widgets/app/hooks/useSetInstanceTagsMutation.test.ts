import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "./queryKeys"
import { buildSetTagsMutationOptions } from "./useSetInstanceTagsMutation"

describe("set tags mutation", () => {
  it("onMutate patches detail tags and onError restores them", async () => {
    const qc = new QueryClient()
    qc.setQueryData(QUERY_KEYS.instanceDetail("s1"), { id: "s1", tags: ["old"] })
    const api = { instances: { setTags: vi.fn() } } as never
    const opts = buildSetTagsMutationOptions(api, qc)

    const ctx = await opts.onMutate!({ id: "s1", tags: ["web", "prod"] })
    expect(qc.getQueryData<{ tags: string[] }>(QUERY_KEYS.instanceDetail("s1"))!.tags).toEqual(["web", "prod"])

    opts.onError!(new Error("x"), { id: "s1", tags: ["web", "prod"] }, ctx)
    expect(qc.getQueryData<{ tags: string[] }>(QUERY_KEYS.instanceDetail("s1"))!.tags).toEqual(["old"])
  })

  it("mutationFn calls setTags with id and the tag list", async () => {
    const qc = new QueryClient()
    const setTags = vi.fn().mockResolvedValue(undefined)
    const api = { instances: { setTags } } as never
    const opts = buildSetTagsMutationOptions(api, qc)
    await opts.mutationFn!({ id: "s1", tags: [] })
    expect(setTags).toHaveBeenCalledWith("s1", [])
  })
})
