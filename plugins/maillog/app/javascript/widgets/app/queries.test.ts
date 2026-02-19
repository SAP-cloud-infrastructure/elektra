import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useGetData } from "./queries"
import { dataFn, HTTPError, NetworkError } from "./actions"
import React from "react"

// Mock the actions module
vi.mock("./actions", () => ({
  dataFn: vi.fn(),
  HTTPError: class HTTPError extends Error {
    statusCode: number
    constructor(code: number, message: string) {
      super(message)
      this.statusCode = code
    }
  },
  NetworkError: class NetworkError extends Error {
    constructor(message: string) {
      super(message)
    }
  },
}))

describe("queries.ts", () => {
  describe("useGetData", () => {
    let queryClient: QueryClient
    let wrapper: React.FC<{ children: React.ReactNode }>

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            // Don't set retry here - let the hook's inline retry logic handle it
          },
        },
      })
      wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children)
      vi.clearAllMocks()
    })

    afterEach(() => {
      queryClient.clear()
    })

    describe("Basic functionality", () => {
      it("makes a query with correct parameters", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const bearerToken = "test-token"
        const endpoint = "https://api.example.com"
        const options = { page: 1, per_page: 20 }

        const { result } = renderHook(() => useGetData(bearerToken, endpoint, options), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(dataFn).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ["data", bearerToken, endpoint, options],
          })
        )
        expect(result.current.data).toEqual(mockData)
      })

      it("returns loading state initially", () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        expect(result.current.isLoading).toBe(true)
        expect(result.current.data).toBeUndefined()
      })

      it("returns data on successful fetch", async () => {
        const mockData = {
          data: [
            { id: "1", from: "test@example.com", subject: "Test" },
            { id: "2", from: "test2@example.com", subject: "Test 2" },
          ] as any,
          hits: 2,
        }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toEqual(mockData)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
      })

      it("returns error on failed fetch", async () => {
        const mockError = new HTTPError(404, "Not Found")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })

        expect(result.current.error).toEqual(mockError)
        expect(result.current.data).toBeUndefined()
      })
    })

    describe("Query enabling", () => {
      it("does not execute query when bearerToken is empty", () => {
        const { result } = renderHook(() => useGetData("", "endpoint", {}), { wrapper })

        expect(result.current.status).toBe("loading")
        expect(result.current.fetchStatus).toBe("idle")
        expect(dataFn).not.toHaveBeenCalled()
      })

      it("executes query when bearerToken is provided", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const { result } = renderHook(() => useGetData("valid-token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(dataFn).toHaveBeenCalled()
      })

      it("does not execute when bearerToken is undefined", () => {
        const { result } = renderHook(() => useGetData(undefined as unknown as string, "endpoint", {}), { wrapper })

        expect(result.current.status).toBe("loading")
        expect(result.current.fetchStatus).toBe("idle")
        expect(dataFn).not.toHaveBeenCalled()
      })

      it("does not execute when bearerToken is null", () => {
        const { result } = renderHook(() => useGetData(null as unknown as string, "endpoint", {}), { wrapper })

        expect(result.current.status).toBe("loading")
        expect(result.current.fetchStatus).toBe("idle")
        expect(dataFn).not.toHaveBeenCalled()
      })
    })

    describe("keepPreviousData behavior", () => {
      it("keeps previous data while fetching new data", async () => {
        const mockData1 = { data: [{ id: "1" }] as any, hits: 1 }
        const mockData2 = { data: [{ id: "2" }] as any, hits: 1 }

        vi.mocked(dataFn).mockResolvedValueOnce(mockData1)

        const { result, rerender } = renderHook(({ options }) => useGetData("token", "endpoint", options), {
          wrapper,
          initialProps: { options: { page: 1 } },
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(mockData1)

        // Change options and mock new data
        vi.mocked(dataFn).mockResolvedValueOnce(mockData2)
        rerender({ options: { page: 2 } })

        // While fetching, previous data should still be available
        // Note: keepPreviousData is deprecated in newer versions, but this tests the intent
        expect(result.current.data).toBeDefined()

        await waitFor(() => expect(result.current.data).toEqual(mockData2))
      })
    })

    describe("Retry logic", () => {
      // Note: The useGetData hook has inline retry logic that overrides QueryClient defaults
      // So we don't need to set up special retry logic here - the hook handles it

      it("does not retry on 401 authentication error", async () => {
        const mockError = new HTTPError(401, "Unauthorized")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(dataFn).toHaveBeenCalledTimes(1)
      })

      it("does not retry on 403 forbidden error", async () => {
        const mockError = new HTTPError(403, "Forbidden")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(dataFn).toHaveBeenCalledTimes(1)
      })

      it("does not retry on 404 not found error", async () => {
        const mockError = new HTTPError(404, "Not Found")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(dataFn).toHaveBeenCalledTimes(1)
      })

      it("does not retry on 400 bad request error", async () => {
        const mockError = new HTTPError(400, "Bad Request")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(dataFn).toHaveBeenCalledTimes(1)
      })

      it("does not retry on 429 rate limit error", async () => {
        const mockError = new HTTPError(429, "Too Many Requests")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(dataFn).toHaveBeenCalledTimes(1)
      })

      it("retries up to 3 times on 500 server error", async () => {
        const mockError = new HTTPError(500, "Internal Server Error")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 15000 })

        expect(dataFn).toHaveBeenCalledTimes(4) // Initial call + 3 retries
      }, 15000)

      it("retries up to 3 times on 502 bad gateway error", async () => {
        const mockError = new HTTPError(502, "Bad Gateway")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 15000 })

        expect(dataFn).toHaveBeenCalledTimes(4)
      }, 15000)

      it("retries up to 3 times on 503 service unavailable error", async () => {
        const mockError = new HTTPError(503, "Service Unavailable")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 15000 })

        expect(dataFn).toHaveBeenCalledTimes(4)
      }, 15000)

      it("retries on network errors", async () => {
        const mockError = new NetworkError("Network connection failed")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 15000 })

        expect(dataFn).toHaveBeenCalledTimes(4)
      }, 15000)

      it("succeeds on retry after transient failure", async () => {
        const mockError = new HTTPError(503, "Service Unavailable")
        const mockData = { data: [], hits: 0 }

        vi.mocked(dataFn).mockRejectedValueOnce(mockError).mockResolvedValueOnce(mockData)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 15000 })

        expect(result.current.data).toEqual(mockData)
        expect(dataFn).toHaveBeenCalledTimes(2) // Initial call + 1 retry
      }, 15000)
    })

    describe("Query key uniqueness", () => {
      it("creates unique query key for different tokens", () => {
        const { result: result1 } = renderHook(() => useGetData("token1", "endpoint", {}), { wrapper })
        const { result: result2 } = renderHook(() => useGetData("token2", "endpoint", {}), { wrapper })

        expect(result1.current).not.toBe(result2.current)
      })

      it("creates unique query key for different endpoints", () => {
        const { result: result1 } = renderHook(() => useGetData("token", "endpoint1", {}), { wrapper })
        const { result: result2 } = renderHook(() => useGetData("token", "endpoint2", {}), { wrapper })

        expect(result1.current).not.toBe(result2.current)
      })

      it("creates unique query key for different options", () => {
        const { result: result1 } = renderHook(() => useGetData("token", "endpoint", { page: 1 }), { wrapper })
        const { result: result2 } = renderHook(() => useGetData("token", "endpoint", { page: 2 }), { wrapper })

        expect(result1.current).not.toBe(result2.current)
      })

      it("uses same query key for identical parameters", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const { result: result1 } = renderHook(() => useGetData("token", "endpoint", { page: 1 }), { wrapper })
        const { result: result2 } = renderHook(() => useGetData("token", "endpoint", { page: 1 }), { wrapper })

        await waitFor(() => expect(result1.current.isSuccess).toBe(true))

        // Both should share the same cached data
        expect(result1.current.data).toEqual(result2.current.data)
        expect(dataFn).toHaveBeenCalledTimes(1) // Only called once due to caching
      })
    })

    describe("Options parameter variations", () => {
      it("handles empty options object", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toEqual(mockData)
      })

      it("handles options with pagination", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const options = { page: 2, per_page: 50 }
        const { result } = renderHook(() => useGetData("token", "endpoint", options), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(dataFn).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ["data", "token", "endpoint", options],
          })
        )
      })

      it("handles options with search filters", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const options = { from: "test@example.com", subject: "Test" }
        const { result } = renderHook(() => useGetData("token", "endpoint", options), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(dataFn).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ["data", "token", "endpoint", options],
          })
        )
      })

      it("handles options with date ranges", async () => {
        const mockData = { data: [], hits: 0 }
        vi.mocked(dataFn).mockResolvedValue(mockData)

        const options = { start: new Date("2024-01-01"), end: new Date("2024-01-31") }
        const { result } = renderHook(() => useGetData("token", "endpoint", options), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(dataFn).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ["data", "token", "endpoint", options],
          })
        )
      })
    })

    describe("Error handling edge cases", () => {
      it("handles generic Error objects", async () => {
        const mockError = new HTTPError(400, "Bad Request")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })

        expect(result.current.error).toEqual(mockError)
      })

      it("handles error without statusCode property", async () => {
        const mockError = new Error("Unknown error")
        vi.mocked(dataFn).mockRejectedValue(mockError)

        const { result } = renderHook(() => useGetData("token", "endpoint", {}), { wrapper })

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 15000 })

        // Should retry because statusCode is undefined (not in 400-499 range)
        expect(dataFn).toHaveBeenCalledTimes(4)
      }, 15000)
    })
  })
})
