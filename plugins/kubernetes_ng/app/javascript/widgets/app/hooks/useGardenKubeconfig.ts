import { useMutation } from "@tanstack/react-query"
import { GardenerApi } from "../apiClient"

/**
 * Mutation hook for downloading the garden kubeconfig
 * Triggers a browser download of the garden-level kubeconfig YAML file
 */
export function useGardenKubeconfigDownload(apiClient: GardenerApi | undefined) {
  return useMutation<string, Error, void>({
    mutationFn: async () => {
      if (!apiClient) {
        throw new Error("API client is not available")
      }
      return apiClient.gardener.getGardenerApiKubeconfig()
    },
  })
}
