import React, { useEffect, useState, useCallback } from "react"
import { useHistory, useLocation, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Panel,
  PanelBody,
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
  CodeBlock,
  Badge,
  Button,
  Message,
} from "@cloudoperators/juno-ui-components"
import { getOrder } from "../../orderActions"
import { getUsername } from "../../helperActions"
import HintLoading from "../HintLoading"
import { getOrderUuid, getOrderName } from "../../../lib/orderHelper"

const Row = ({ label, value, children }) => {
  return (
    <DataGridRow>
      <DataGridHeadCell>{label}</DataGridHeadCell>
      <DataGridCell className="tw-break-all">{value || children}</DataGridCell>
    </DataGridRow>
  )
}

const OrderDetails = () => {
  const location = useLocation()
  const history = useHistory()
  const params = useParams()
  const [creatorName, setCreatorName] = useState(null)
  const [show, setShow] = useState(false)

  const order = useQuery(["order", params.id], getOrder, {
    enabled: !!params.id,
  })

  const orderCreator = useQuery(
    ["orderCreator", order?.data?.creator_id],
    getUsername,
    {
      enabled: !!order?.data?.creator_id,
      onSuccess: (data) => {
        setCreatorName(data)
      },
      onError: () => {
        setCreatorName(null)
      },
    }
  )

  useEffect(() => {
    setShow(!!params.id)
  }, [params.id])



  const handleViewSecret = useCallback(() => {
    if (order?.data?.secret_ref) {
      const secretId = order.data.secret_ref.split('/').pop()
      history.push(`/secrets/${secretId}/show`)
    }
  }, [order?.data?.secret_ref, history])

  const restoreURL = useCallback(() => {
    history.replace(
      location.pathname.replace(/^(\/[^/]*)\/.+\/show$/, (a, b) => b)
    )
  }, [history, location])

  const close = useCallback(() => {
    setShow(false)
    restoreURL()
  }, [restoreURL])

  const isOrderCompleted = order?.data?.status === "ACTIVE" || order?.data?.status === "COMPLETED"
  const hasSecret = order?.data?.secret_ref && isOrderCompleted

  return (
    <Panel
      opened={true}
      onClose={close}
      heading={
        <span className="tw-break-all">{`Order ${
          order?.data ? (getOrderName(order.data) || getOrderUuid(order.data)) : ""
        }`}</span>
      }
      size="large"
      className="tw-z-[1050]"
    >
      <PanelBody>
        {order?.isLoading && !order?.data ? (
          <HintLoading />
        ) : order?.isError ? (
          <Message variant="danger">
            {`${order?.error?.statusCode}, ${order?.error?.message}`}
          </Message>
        ) : order?.data ? (
          <>
            <DataGrid columns={2}>
              <Row label="Name" value={order?.data?.name} />
              <Row label="Order Ref" value={getOrderUuid(order?.data)} />
              <Row label="Type" value={order?.data?.type} />
              <Row
                label="Created at"
                value={new Date(order?.data?.created).toUTCString()}
              />
              <DataGridRow>
                <DataGridHeadCell>Owner</DataGridHeadCell>
                <DataGridCell>
                  {creatorName ? (
                    <>
                      {creatorName}
                      <br />
                    </>
                  ) : (
                    <Badge className="tw-display-inline">
                      {order?.data?.creator_id}
                    </Badge>
                  )}
                </DataGridCell>
              </DataGridRow>
              <Row label="Status" value={order?.data?.status} />
              {order?.data?.updated && order?.data?.updated !== order?.data?.created && (
                <Row
                  label="Updated at"
                  value={new Date(order?.data?.updated).toUTCString()}
                />
              )}
              {order?.data?.expiration && (
                <Row
                  label="Expiration"
                  value={new Date(order?.data?.expiration).toUTCString()}
                />
              )}
              {order?.data?.meta?.algorithm && (
                <Row label="Algorithm" value={order?.data?.meta?.algorithm.toUpperCase()} />
              )}
              {order?.data?.meta?.bit_length && (
                <Row label="Bit Length" value={order?.data?.meta?.bit_length} />
              )}
              {order?.data?.meta?.mode && (
                <Row label="Mode" value={order?.data?.meta?.mode.toUpperCase()} />
              )}
              {order?.data?.meta?.payload_content_type && (
                <Row label="Content Type" value={order?.data?.meta?.payload_content_type} />
              )}
              {hasSecret && (
                <DataGridRow>
                  <DataGridHeadCell>Generated Secret</DataGridHeadCell>
                  <DataGridCell>
                    <div>
                      <div className="tw-mb-2">
                        <strong>Secret ID:</strong> {order?.data?.secret_ref ? order.data.secret_ref.split('/').pop() : 'N/A'}
                      </div>
                      <Button
                        icon="external-link"
                        label="View Secret"
                        onClick={handleViewSecret}
                      />
                    </div>
                  </DataGridCell>
                </DataGridRow>
              )}
            </DataGrid>
            {order?.data?.meta && Object.keys(order?.data?.meta).length > 0 && (
              <CodeBlock
                heading="All Metadata"
                content={order?.data?.meta}
                lang="json"
                className="tw-mt-6"
              />
            )}
          </>
        ) : (
          <span>Order {params?.id} not found</span>
        )}
      </PanelBody>
    </Panel>
  )
}

export default OrderDetails 