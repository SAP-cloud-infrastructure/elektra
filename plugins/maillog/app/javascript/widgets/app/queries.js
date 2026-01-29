import { useQuery } from "@tanstack/react-query"
import { dataFn } from "./actions"

// get all services
export const useGetData = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["data", bearerToken, endpoint, options],
    queryFn: dataFn,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
    // Retry logic for failed requests
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401) or forbidden (403)
      if (error.statusCode === 401 || error.statusCode === 403) {
        return false
      }
      // Don't retry on client errors (400-499)
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return false
      }
      // Retry up to 3 times for server errors (500+) or network errors
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 30000)
    },
  })
}
