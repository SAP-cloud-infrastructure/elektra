import React, { useEffect, useCallback } from "react"
import { Panel } from "@cloudoperators/juno-ui-components"
import { useHistory, useLocation } from "react-router-dom"
import {
  useActions,
  MessagesProvider,
} from "@cloudoperators/juno-messages-provider"
import useStore from "../../store"
import NewOrderForm from "./newOrderForm"

const NewOrder = () => {
  const location = useLocation()
  const history = useHistory()
  const { addMessage } = useActions()
  const setShowNewOrder = useStore(
    useCallback((state) => state.setShowNewOrder)
  )
  const showNewOrder = useStore(useCallback((state) => state.showNewOrder))
  const close = useCallback(() => {
    setShowNewOrder(false)
    history.replace(location.pathname.replace("/newOrder", "")),
      [history, location]
  }, [])

  const onSuccessfullyCloseForm = useCallback((orderUuid) => {
    close()
    addMessage({
      variant: "success",
      text: `The order ${orderUuid} is successfully created.`,
    })
  }, [])

  useEffect(() => {
    setShowNewOrder(true)
  }, [])

  return (
    <Panel
      opened={showNewOrder}
      onClose={close}
      heading="New Order"
      className="tw-z-[1050]"
    >
      <MessagesProvider>
        <NewOrderForm
          onSuccessfullyCloseForm={onSuccessfullyCloseForm}
          onClose={close}
        />
      </MessagesProvider>
    </Panel>
  )
}
export default NewOrder 