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
  })
}
