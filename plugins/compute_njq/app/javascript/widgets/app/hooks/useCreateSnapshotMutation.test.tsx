import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import { useCreateSnapshotMutation } from "./useCreateSnapshotMutation"

function wrapper() {
  const qc = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useCreateSnapshotMutation", () => {
  it("calls createSnapshot and returns the image id", async () => {
    const createSnapshot = vi.fn().mockResolvedValue({ image_id: "img-7" })
    const api = { instances: { createSnapshot } } as unknown as ComputeApi
    const { result } = renderHook(() => useCreateSnapshotMutation(api), { wrapper: wrapper() })

    let returned: { image_id: string | null } | undefined
    await act(async () => {
      returned = await result.current.mutateAsync({ id: "s1", name: "snap-1" })
    })

    expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1")
    expect(returned).toEqual({ image_id: "img-7" })
  })

  it("surfaces an error from createSnapshot", async () => {
    const createSnapshot = vi.fn().mockRejectedValue(new Error("quota exceeded"))
    const api = { instances: { createSnapshot } } as unknown as ComputeApi
    const { result } = renderHook(() => useCreateSnapshotMutation(api), { wrapper: wrapper() })

    act(() => {
      result.current.mutate({ id: "s1", name: "snap-1" })
    })
    await waitFor(() => expect(result.current.error?.message).toBe("quota exceeded"))
  })
})
