import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFlavorsQuery } from "./useFormOptionQueries"

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe("useFlavorsQuery", () => {
  it("does not fetch while disabled", () => {
    const api = { formOptions: { getFlavors: vi.fn() } } as never
    renderHook(() => useFlavorsQuery(api, { enabled: false }), { wrapper: wrapper() })
    expect(
      (api as never as { formOptions: { getFlavors: ReturnType<typeof vi.fn> } }).formOptions.getFlavors
    ).not.toHaveBeenCalled()
  })

  it("fetches when enabled", async () => {
    const getFlavors = vi.fn().mockResolvedValue([{ id: "f1" }])
    const api = { formOptions: { getFlavors } } as never
    const { result } = renderHook(() => useFlavorsQuery(api, { enabled: true }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data).toEqual([{ id: "f1" }]))
  })
})
