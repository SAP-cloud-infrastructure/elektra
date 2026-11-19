import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import { useImageStatusQuery, isTerminalStatus } from "./useImageStatusQuery"

function wrapper() {
  const qc = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("isTerminalStatus", () => {
  it("treats active/killed/deleted/error as terminal", () => {
    expect(isTerminalStatus("active")).toBe(true)
    expect(isTerminalStatus("error")).toBe(true)
    expect(isTerminalStatus("saving")).toBe(false)
    expect(isTerminalStatus("queued")).toBe(false)
  })
})

describe("useImageStatusQuery", () => {
  it("does not fetch when disabled (no image id yet)", () => {
    const getStatus = vi.fn()
    const api = { images: { getStatus } } as unknown as ComputeApi
    renderHook(() => useImageStatusQuery(api, null, { enabled: false }), { wrapper: wrapper() })
    expect(getStatus).not.toHaveBeenCalled()
  })

  it("fetches the status when enabled with an image id", async () => {
    const getStatus = vi.fn().mockResolvedValue({ id: "img-7", name: "snap-1", status: "saving" })
    const api = { images: { getStatus } } as unknown as ComputeApi
    const { result } = renderHook(() => useImageStatusQuery(api, "img-7", { enabled: true }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.status).toBe("saving"))
    expect(getStatus).toHaveBeenCalledWith("img-7")
  })
})
