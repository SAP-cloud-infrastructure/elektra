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
import { deleteOrder } from "../../orderActions"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import HintLoading from "../HintLoading"
import { useActions } from "@cloudoperators/juno-messages-provider"
import useStore from "../../store"
import ConfirmationModal from "../ConfirmationModal"
import { getOrderUuid, getOrderName } from "../../../lib/orderHelper"

const OrderListItem = ({ order, resetSearch, refreshSearch }) => {
  const orderUuid = getOrderUuid(order)
  const orderName = getOrderName(order)
  
  const queryClient = useQueryClient()

  const { isLoading, data, mutate } = useMutation({
    mutationFn: deleteOrder,
    cacheTime: 100,
    mutationKey: orderUuid,
  })
  const { addMessage } = useActions()
  const showNewOrder = useStore(
    useCallback((state) => state.showNewOrder)
  )
  const [show, setShow] = useState(false)

  const handleDelete = () => {
    setShow(true)
  }

  const onConfirm = () => {
    return mutate(
      {
        id: orderUuid,
      },
      {
        onSuccess: () => {
          setShow(false)
          // Refresh search results if currently searching, otherwise just invalidate main queries
          if (refreshSearch) {
            refreshSearch()
          } else {
            resetSearch()
          }
          queryClient.invalidateQueries("orders")
          addMessage({
            variant: "success",
            text: `The order ${orderUuid} is successfully deleted.`,
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
      <DataGridRow data-target={orderName || orderUuid}>
        <DataGridCell>
          <div>
            <Link
              className="tw-break-all"
              to={`/orders/${orderUuid}/show`}
              onClick={(event) => showNewOrder && event.preventDefault()}
            >
              {orderName || orderUuid}
            </Link>
            <br />
            <Badge className="tw-text-xs" data-target="order-uuid">
              {orderUuid}
            </Badge>
          </div>
        </DataGridCell>
        <DataGridCell>{order.type || "N/A"}</DataGridCell>
        <DataGridCell>{order.status}</DataGridCell>
        <DataGridCell nowrap>
          <ButtonRow>
            {policy.isAllowed("keymanagerng:order_delete") && (
              <Icon
                icon="deleteForever"
                onClick={handleDelete}
                data-target={orderUuid}
              />
            )}
          </ButtonRow>
        </DataGridCell>
      </DataGridRow>
      <ConfirmationModal
        text={`Are you sure you want to delete the order ${
          orderName || orderUuid
        }?`}
        show={show}
        close={close}
        onConfirm={onConfirm}
      />
    </>
  )
}

export default OrderListItem 