import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

const SHARED = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const

// Attach-interface modal data: available networks and subnets to pick from.
// Fetched fresh when the modal opens, hence the modest staleTime.
export function useInterfaceOptionsQuery(api: ComputeApi) {
  return useQuery({
    queryKey: QUERY_KEYS.interfaceOptions,
    queryFn: () => api.formOptions.getInterfaceOptions(),
    ...SHARED,
  })
}
