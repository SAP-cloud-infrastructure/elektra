import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { buildDetachInterfaceMutationOptions } from "./useDetachInterfaceMutation"
import { QUERY_KEYS } from "./queryKeys"

const api = { instances: { detachInterface: vi.fn().mockResolvedValue(undefined) } } as never

describe("buildDetachInterfaceMutationOptions", () => {
  it("marks the row detaching_interface", async () => {
    const qc = new QueryClient()
    qc.setQueryData(QUERY_KEYS.instances, [{ id: "s1", status: { state: "active", transition: null } }])
    const opts = buildDetachInterfaceMutationOptions(api, qc)
    await opts.onMutate!({ id: "s1", fixed_ip_address: "10.0.0.9" } as never)
    const patched = qc.getQueryData(QUERY_KEYS.instances) as Array<{ status: { transition: string } }>
    expect(patched[0].status.transition).toBe("detaching_interface")
  })

  it("invalidates the attached-interfaces key on settle", async () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const opts = buildDetachInterfaceMutationOptions(api, qc)
    opts.onSettled!(undefined, null, { id: "s1", fixed_ip_address: "10.0.0.9" } as never, undefined as never)
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.attachedInterfaces("s1") })
  })
})
