import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "./queryKeys"
import type { Instance } from "../types/instance"
import { buildUpdateNameMutationOptions } from "./useUpdateInstanceNameMutation"

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

describe("update name mutation", () => {
  it("onMutate patches the row name and onError restores it", async () => {
    const qc = new QueryClient()
    seedList(qc)
    const api = { instances: { updateName: vi.fn() } } as never
    const opts = buildUpdateNameMutationOptions(api, qc)

    const ctx = await opts.onMutate!({ id: "s1", name: "web-02" })
    expect(rows(qc)[0].name).toBe("web-02")

    opts.onError!(new Error("boom"), { id: "s1", name: "web-02" }, ctx)
    expect(rows(qc)[0].name).toBe("x")
  })

  it("mutationFn calls updateName with id and name", async () => {
    const qc = new QueryClient()
    const updateName = vi.fn().mockResolvedValue(undefined)
    const api = { instances: { updateName } } as never
    const opts = buildUpdateNameMutationOptions(api, qc)
    await opts.mutationFn!({ id: "s1", name: "web-02" })
    expect(updateName).toHaveBeenCalledWith("s1", "web-02")
  })
})
