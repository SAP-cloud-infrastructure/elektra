import React from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useParams, useRouteContext } from "@tanstack/react-router"
import { Permissions } from "../../../../types/permissions"
import { Cluster } from "../../../../types/cluster"
import DeleteDialog from "./DeleteDialog"
import { CLUSTER_DETAIL_ROUTE_ID } from "../../$clusterName"
import { useActions } from "@cloudoperators/juno-messages-provider"
import { normalizeError } from "../../../../components/InlineError"
import { RouterContext } from "../../../__root"
import DisableableButton from "../../../../components/DisableableButton"

interface MainActionsProps {
  shootPermissions?: Permissions
  kubeconfigPermissions?: Permissions
  disabled?: boolean
  disabledMessage?: string
}

function MainActions({ shootPermissions, kubeconfigPermissions, disabled = false, disabledMessage }: MainActionsProps) {
  const router = useRouter()
  const params = useParams({ from: CLUSTER_DETAIL_ROUTE_ID })
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const { addMessage, resetMessages } = useActions()
  const { apiClient } = useRouteContext({ strict: false }) as RouterContext

  // Helper to determine the disabled message for Kube Config button
  const getKubeconfigDisabledMessage = () => {
    if (disabled && disabledMessage) return disabledMessage
    if (!kubeconfigPermissions) return "Permissions are not available"
    if (!kubeconfigPermissions.create) return "You don't have permission to download kubeconfig"
    return undefined
  }

  // Helper to determine the disabled message for Delete button
  const getDeleteDisabledMessage = () => {
    if (disabled && disabledMessage) return disabledMessage
    if (!shootPermissions) return "Permissions are not available"
    if (!shootPermissions.delete) return "You don't have permission to delete this cluster"
    return undefined
  }

  const kubeconfigMutation = useMutation<string, Error, void>({
    mutationFn: async () => {
      return apiClient.gardener.getKubeconfig(params.clusterName)
    },

    onSuccess: (kubeconfigYaml) => {
      // Create a file-like object in memory from the YAML
      const blob = new Blob([kubeconfigYaml], {
        type: "application/x-yaml",
      })

      // Create a temporary URL pointing to the in-memory file
      const url = URL.createObjectURL(blob)

      // Create a temporary anchor element to trigger the download
      const a = document.createElement("a")
      a.href = url
      a.download = `${params.clusterName}-kubeconfig.yaml`

      // Required for Safari / Firefox compatibility
      document.body.appendChild(a)
      a.click()
      a.remove()

      // Revoke the object URL after the download has been triggered
      setTimeout(() => URL.revokeObjectURL(url), 0)
    },
    onError: (error) => {
      resetMessages()
      const errText = normalizeError(error)
      addMessage({ text: `${errText.title}${errText.message}`, variant: "danger" })
    },
  })

  const deleteMutation = useMutation<Cluster, Error, void>({
    mutationFn: async () => {
      return apiClient.gardener.confirm_deletion_and_destroy(params.clusterName)
    },
    onSuccess: () => {
      // after deletion, navigate back to the clusters list and use replace to avoid going back to deleted cluster
      router.navigate({
        to: "/clusters",
        replace: true,
        state: (prev) => ({
          ...prev,
          successMessage: `Cluster ${params.clusterName} is being deleted.`,
        }),
      })
      // Invalidate after navigation so the list reloads
      router.invalidate()
    },
    onError: (error) => {
      setShowDeleteDialog(false)
      resetMessages()
      const errText = normalizeError(error)
      addMessage({ text: `${errText.title}${errText.message}`, variant: "danger" })
    },
  })

  return (
    <>
      <DisableableButton
        size="small"
        label="Kube Config"
        icon="download"
        title="Download Kube Config valid for 8 hours"
        disabled={disabled || kubeconfigMutation.isPending || !kubeconfigPermissions?.create}
        progress={kubeconfigMutation.isPending}
        onClick={() => kubeconfigMutation.mutate()}
        disabledMessage={getKubeconfigDisabledMessage()}
      />
      <DisableableButton
        size="small"
        label="Delete Cluster"
        variant="primary-danger"
        disabled={disabled || !shootPermissions?.delete}
        onClick={() => setShowDeleteDialog(true)}
        disabledMessage={getDeleteDisabledMessage()}
      />
      <DeleteDialog
        // reset key to remount dialog and reset internal state on open/close
        key={`delete-dialog-${params.clusterName}-${showDeleteDialog}`}
        clusterName={params.clusterName}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation?.mutate()}
        isDeleting={deleteMutation?.isPending}
      />
    </>
  )
}

export default MainActions
