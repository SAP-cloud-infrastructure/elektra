import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "./queryKeys"
import type { Instance } from "../types/instance"
import type { ComputeApi } from "../apiClient"
import { buildResizeMutationOptions } from "./useResizeInstanceMutation"

function seedList(qc: QueryClient) {
  qc.setQueryData(QUERY_KEYS.instances, [
    {
      id: "s1",
      name: "x",
      status: { state: "active", transition: null },
      locked: false,
      flavor: { id: null, name: null },
      image: { id: null, name: null },
      ips: [],
      created: null,
    },
  ])
}

const rows = (qc: QueryClient) => qc.getQueryData<Instance[]>(QUERY_KEYS.instances)!

function setup() {
  const resizeInstance = vi.fn().mockResolvedValue(undefined)
  const api = { instances: { resizeInstance } } as unknown as ComputeApi
  const qc = new QueryClient()
  return { api, qc, resizeInstance }
}

describe("buildResizeMutationOptions", () => {
  it("calls resizeInstance with id and flavorId", async () => {
    const { api, qc, resizeInstance } = setup()
    const opts = buildResizeMutationOptions(api, qc)
    await opts.mutationFn!({ id: "s1", flavorId: "f2" })
    expect(resizeInstance).toHaveBeenCalledWith("s1", "f2")
  })

  it("optimistically marks the list row as transitioning and restores on error", async () => {
    const { api, qc } = setup()
    seedList(qc)
    const opts = buildResizeMutationOptions(api, qc)
    const ctx = await opts.onMutate!({ id: "s1", flavorId: "f2" })
    expect(rows(qc)[0].status.transition).toBe("resize_prep")
    opts.onError!(new Error("x"), { id: "s1", flavorId: "f2" }, ctx as never)
    expect(rows(qc)[0].status.transition).toBeNull()
  })

  it("invalidates instances and instanceDetail on settle", () => {
    const { api, qc } = setup()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const opts = buildResizeMutationOptions(api, qc)
    opts.onSettled!(undefined, null, { id: "s1", flavorId: "f2" }, undefined as never)
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
