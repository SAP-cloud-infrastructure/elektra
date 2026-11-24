import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { ComputeApi } from "../apiClient"
import { useInstanceConsoleQuery } from "./useInstanceConsoleQuery"

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const console = { url: "https://c.cloud.sap/vnc?token=x", type: "novnc", protocol: "vnc" }

describe("useInstanceConsoleQuery", () => {
  it("fetches the console when enabled", async () => {
    const getConsole = vi.fn().mockResolvedValue(console)
    const api = { instances: { getConsole } } as unknown as ComputeApi
    const { result } = renderHook(() => useInstanceConsoleQuery(api, "s1", true), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getConsole).toHaveBeenCalledWith("s1")
    expect(result.current.data).toEqual(console)
  })

  it("does not fetch while disabled", () => {
    const getConsole = vi.fn().mockResolvedValue(console)
    const api = { instances: { getConsole } } as unknown as ComputeApi
    renderHook(() => useInstanceConsoleQuery(api, "s1", false), { wrapper: wrapper() })
    expect(getConsole).not.toHaveBeenCalled()
  })
})
