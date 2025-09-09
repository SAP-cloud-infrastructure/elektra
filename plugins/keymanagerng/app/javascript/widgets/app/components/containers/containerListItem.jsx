import React, { useCallback, useState } from "react"
import { Link } from "react-router-dom"
import { policy } from "lib/policy"
import {
  Badge,
  ButtonRow,
  Icon,
  DataGridRow,
  DataGridCell,
} from "@cloudoperators/juno-ui-components"
import { getContainerUuid } from "../../../lib/containerHelper"
import { deleteContainer } from "../../containerActions"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import HintLoading from "../HintLoading"
import { useActions } from "@cloudoperators/juno-messages-provider"
import useStore from "../../store"
import ConfirmationModal from "../ConfirmationModal"

const ContainerListItem = ({ container, resetSearch }) => {
  const containerUuid = getContainerUuid(container)

  const queryClient = useQueryClient()

  const { isLoading, data, mutate } = useMutation({
    mutationFn: deleteContainer,
    cacheTime: 100,
    mutationKey: containerUuid,
  })
  const { addMessage } = useActions()
  const showNewContainer = useStore(
    useCallback((state) => state.showNewContainer)
  )
  const [show, setShow] = useState(false)

  const handleDelete = () => {
    setShow(true)
  }

  const onConfirm = () => {
    return mutate(
      {
        id: containerUuid,
      },
      {
        onSuccess: () => {
          setShow(false)
          // Reset search state and invalidate queries
          resetSearch()
          queryClient.invalidateQueries("containers")
          addMessage({
            variant: "success",
            text: `The container ${containerUuid} is successfully deleted.`,
          })
        },
        onError: (error) => {
          setShow(false)
          addMessage({
            variant: "error",
            text: error.data.error,
          })
        },
      }
    )
  }

  const close = () => {
    setShow(false)
  }
  return isLoading && !data ? (
    <DataGridRow>
      <DataGridCell>
        <HintLoading />
      </DataGridCell>
      <DataGridCell></DataGridCell>
      <DataGridCell></DataGridCell>
      <DataGridCell></DataGridCell>
    </DataGridRow>
  ) : (
    <>
      <DataGridRow data-target={container.name}>
        <DataGridCell>
          <div>
            <Link
              className="tw-break-all"
              to={`/containers/${containerUuid}/show`}
              onClick={(event) => showNewContainer && event.preventDefault()}
            >
              {container.name || containerUuid}
            </Link>
            <br />
            <Badge className="tw-text-xs" data-target="container-uuid">
              {containerUuid}
            </Badge>
          </div>
        </DataGridCell>
        <DataGridCell>{container.type}</DataGridCell>
        <DataGridCell>{container.status}</DataGridCell>
        <DataGridCell nowrap>
          <ButtonRow>
            {policy.isAllowed("keymanagerng:container_delete") && (
              <Icon
                icon="deleteForever"
                onClick={() => handleDelete(containerUuid)}
                data-target={containerUuid}
              />
            )}
          </ButtonRow>
        </DataGridCell>
      </DataGridRow>
      <ConfirmationModal
        text={`Are you sure you want to delete the container ${
          container.name || containerUuid
        }?`}
        show={show}
        close={close}
        onConfirm={onConfirm}
      />
    </>
  )
}

export default ContainerListItem
