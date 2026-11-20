import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import type { Instance } from "../types/instance"
import { buildDetachFloatingIpMutationOptions } from "./useDetachFloatingIpMutation"
import { QUERY_KEYS } from "./queryKeys"

function seed(qc: QueryClient) {
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

describe("detach floating ip mutation", () => {
  it("onMutate sets the disassociating transition and onError restores it", async () => {
    const qc = new QueryClient()
    seed(qc)
    const api = { instances: { detachFloatingIp: vi.fn().mockResolvedValue(undefined) } } as unknown as ComputeApi
    const opts = buildDetachFloatingIpMutationOptions(api, qc)
    const ctx = await opts.onMutate!({ id: "s1", floating_ip_address: "1.2.3.4" })
    expect(rows(qc)[0].status.transition).toBe("disassociating_floating_ip")
    opts.onError!(new Error("x"), { id: "s1", floating_ip_address: "1.2.3.4" }, ctx)
    expect(rows(qc)[0].status.transition).toBeNull()
  })

  it("onSettled invalidates the list and the detail", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const api = { instances: { detachFloatingIp: vi.fn() } } as unknown as ComputeApi
    const opts = buildDetachFloatingIpMutationOptions(api, qc)
    opts.onSettled!(undefined, null, { id: "s1", floating_ip_address: "1.2.3.4" }, { previous: undefined })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
