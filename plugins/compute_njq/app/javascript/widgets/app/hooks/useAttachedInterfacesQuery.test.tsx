import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAttachedInterfacesQuery } from "./useAttachedInterfacesQuery"
import { QUERY_KEYS } from "./queryKeys"

function wrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useAttachedInterfacesQuery", () => {
  it("fetches via getAttachedInterfaces when enabled", async () => {
    const getAttachedInterfaces = vi
      .fn()
      .mockResolvedValue({ attached_interfaces: [{ port_id: "p1", fixed_ip_address: "10.0.0.9", mac_addr: null }] })
    const api = { instances: { getAttachedInterfaces } } as never
    const qc = new QueryClient()
    const { result } = renderHook(() => useAttachedInterfacesQuery(api, "s1", true), { wrapper: wrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAttachedInterfaces).toHaveBeenCalledWith("s1")
    expect(qc.getQueryData(QUERY_KEYS.attachedInterfaces("s1"))).toBeTruthy()
  })

  it("does not fetch while disabled", () => {
    const getAttachedInterfaces = vi.fn()
    const api = { instances: { getAttachedInterfaces } } as never
    const qc = new QueryClient()
    renderHook(() => useAttachedInterfacesQuery(api, "s1", false), { wrapper: wrapper(qc) })
    expect(getAttachedInterfaces).not.toHaveBeenCalled()
  })
})
