import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { buildAttachInterfaceMutationOptions } from "./useAttachInterfaceMutation"
import { QUERY_KEYS } from "./queryKeys"
import type { ComputeApi } from "../apiClient"

const api = { instances: { attachInterface: vi.fn().mockResolvedValue(undefined) } } as unknown as ComputeApi

describe("buildAttachInterfaceMutationOptions", () => {
  it("optimistically marks the row attaching_interface and rolls back on error", async () => {
    const qc = new QueryClient()
    qc.setQueryData(QUERY_KEYS.instances, [{ id: "s1", status: { state: "active", transition: null } }])
    const opts = buildAttachInterfaceMutationOptions(api, qc)
    const ctx = await opts.onMutate!({ id: "s1", network_id: "n1" } as never)
    const patched = qc.getQueryData(QUERY_KEYS.instances) as Array<{ status: { transition: string } }>
    expect(patched[0].status.transition).toBe("attaching_interface")
    opts.onError!(new Error("x"), { id: "s1", network_id: "n1" } as never, ctx as never)
    const rolledBack = qc.getQueryData(QUERY_KEYS.instances) as Array<{ status: { transition: string | null } }>
    expect(rolledBack[0].status.transition).toBeNull()
  })

  it("calls the apiClient with the attach body", async () => {
    const qc = new QueryClient()
    const opts = buildAttachInterfaceMutationOptions(api, qc)
    await opts.mutationFn!({ id: "s1", network_id: "n1", subnet_id: "sub1" } as never)
    expect(api.instances.attachInterface).toHaveBeenCalledWith("s1", {
      network_id: "n1",
      subnet_id: "sub1",
      ip_address: undefined,
      security_groups: undefined,
    })
  })
})
