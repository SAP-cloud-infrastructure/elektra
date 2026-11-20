import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import type { Instance } from "../types/instance"
import { QUERY_KEYS } from "./queryKeys"
import { buildCreateSnapshotMutationOptions, useCreateSnapshotMutation } from "./useCreateSnapshotMutation"

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

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

describe("useCreateSnapshotMutation", () => {
  it("calls createSnapshot and returns the image id", async () => {
    const qc = new QueryClient()
    const createSnapshot = vi.fn().mockResolvedValue({ image_id: "img-7" })
    const api = { instances: { createSnapshot } } as unknown as ComputeApi
    const { result } = renderHook(() => useCreateSnapshotMutation(api, qc), { wrapper: wrapper(qc) })

    let returned: { image_id: string | null } | undefined
    await act(async () => {
      returned = await result.current.mutateAsync({ id: "s1", name: "snap-1" })
    })

    expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1")
    expect(returned).toEqual({ image_id: "img-7" })
  })

  it("surfaces an error from createSnapshot", async () => {
    const qc = new QueryClient()
    const createSnapshot = vi.fn().mockRejectedValue(new Error("quota exceeded"))
    const api = { instances: { createSnapshot } } as unknown as ComputeApi
    const { result } = renderHook(() => useCreateSnapshotMutation(api, qc), { wrapper: wrapper(qc) })

    act(() => {
      result.current.mutate({ id: "s1", name: "snap-1" })
    })
    await waitFor(() => expect(result.current.error?.message).toBe("quota exceeded"))
  })
})

// Exercise the onMutate/onError/onSettled callbacks directly (no React render),
// mirroring useInstanceActionMutation.test.ts.
describe("snapshot mutation optimistic transition", () => {
  it("onMutate sets the snapshot transition on the row and onError restores it", async () => {
    const qc = new QueryClient()
    seedList(qc)
    const api = { instances: { createSnapshot: vi.fn() } } as never
    const opts = buildCreateSnapshotMutationOptions(api, qc)

    const ctx = await opts.onMutate!({ id: "s1", name: "snap-1" })
    // The pill reads the first real Nova task_state immediately.
    expect(rows(qc)[0].status.transition).toBe("image_snapshot")

    opts.onError!(new Error("boom"), { id: "s1", name: "snap-1" }, ctx)
    expect(rows(qc)[0].status.transition).toBe(null)
  })

  it("onSettled invalidates the instances list and the instance detail", async () => {
    const qc = new QueryClient()
    seedList(qc)
    const api = { instances: { createSnapshot: vi.fn() } } as never
    const opts = buildCreateSnapshotMutationOptions(api, qc)
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    opts.onSettled!(undefined, null, { id: "s1", name: "snap-1" }, undefined)

    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
