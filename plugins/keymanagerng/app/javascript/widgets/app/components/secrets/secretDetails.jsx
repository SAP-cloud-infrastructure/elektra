import React, { useEffect, useState, useCallback } from "react"
import { useHistory, useLocation, useParams, Link } from "react-router-dom"
import { getSecretUuid } from "../../../lib/secretHelper"
import { getOrderUuid, getOrderName } from "../../../lib/orderHelper"
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
} from "@cloudoperators/juno-ui-components"
import {
  getSecret,
  getSecretMetadata,
  getSecretPayload,
} from "../../secretActions"
import { findOrderBySecretRef } from "../../orderActions"
import { getUsername } from "../../helperActions"
import { useQuery } from "@tanstack/react-query"
import HintLoading from "../HintLoading"
import { Message } from "@cloudoperators/juno-ui-components"

const Row = ({ label, value, children }) => {
  return (
    <DataGridRow>
      <DataGridHeadCell>{label}</DataGridHeadCell>
      <DataGridCell className="tw-break-all">{value || children}</DataGridCell>
    </DataGridRow>
  )
}

const SecretDetails = () => {
  const location = useLocation()
  const history = useHistory()
  const params = useParams()
  const [secretId, setSecretId] = useState(null)
  const [payloadString, setPayloadString] = useState("")
  const [creatorName, setCreatorName] = useState(null)
  const [secretMetadata, setSecretMetadata] = useState(null)
  const [payloadRequested, setPayloadRequested] = useState(false)
  const [generatingOrder, setGeneratingOrder] = useState(null)

  const secret = useQuery(["secret", params.id], getSecret, {
    enabled: !!params.id,
  })

  const [show, setShow] = useState(!!secret?.data)

  useEffect(() => {
    if (secret?.data?.secret_ref) {
      const newSecretId = getSecretUuid(secret?.data)
      setSecretId(newSecretId)
    }
  }, [secret?.data?.secret_ref])

  // Query to find the order that generated this secret
  const orderQuery = useQuery({
    queryKey: ["orderBySecretRef", secretId],
    queryFn: () => findOrderBySecretRef(secretId),
    enabled: !!secretId,
    onSuccess: (data) => {
      setGeneratingOrder(data)
    },
    onError: (error) => {
      console.error("Error finding generating order:", error)
      setGeneratingOrder(null)
    },
  })

  const secretCreator = useQuery(
    ["secretCreator", secret?.data?.creator_id],
    getUsername,
    {
      enabled: !!secret?.data?.creator_id,
      onSuccess: (data) => {
        setCreatorName(data)
      },
      onError: () => {
        setCreatorName(null)
      },
    }
  )

  const metadata = useQuery({
    queryKey: ["secretMetadata", secretId],
    queryFn: getSecretMetadata,
    enabled: !!secretId,
    onSuccess: (data) => {
      if (data) return setSecretMetadata(data)
    },
  })

  useEffect(() => {
    setShow(!!params.id)
  }, [params.id])

  const isPayloadContentTypeTextPlain = (contentType) => {
    return contentType?.includes("text/plain")
  }

  const secretPlayload = useQuery({
    queryKey: [
      "secretPlayload",
      secretId,
    ],
    queryFn: getSecretPayload,
    enabled: !!secretId,
    onSuccess: (data) => {
      if (isPayloadContentTypeTextPlain(secret?.data?.content_types?.default)) {
        setPayloadString(data)
      }
      if (payloadRequested) {
        //Downloading the payload content as a file, put the raw data into a blob
        const blob = new Blob([data], {
          type: secret?.data?.content_types?.default,
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = secret?.data?.name
        link.href = url
        link.click()
        setPayloadRequested(false)
      }
    },
  })

  const handleDownload = useCallback(() => {
    setPayloadRequested(true)
  }, [])

  const restoreURL = useCallback(() => {
    history.replace(
      location.pathname.replace(/^(\/[^/]*)\/.+\/show$/, (a, b) => b)
    )
  }, [history, location])

  const close = useCallback(() => {
    setShow(false)
    restoreURL()
  }, [restoreURL])

  return (
    <Panel
      opened={true}
      onClose={close}
      heading={
        <span className="tw-break-all">{`Secret ${
          secret?.data ? secret?.data?.name : ""
        }`}</span>
      }
      size="large"
      className="tw-z-[1050]"
    >
      <PanelBody>
        {secret?.isLoading && !secret?.data ? (
          <HintLoading />
        ) : secret?.isError ? (
          <Message variant="danger">
            {`${secret?.error?.statusCode}, ${secret?.error?.message}`}
          </Message>
        ) : secret?.data ? (
          <>
            <DataGrid columns={2}>
              <Row label="Name" value={secret?.data?.name} />
              <Row label="Secret Ref" value={secret?.data?.secret_ref} />
              <Row label="Type" value={secret?.data?.secret_type} />
              <Row
                label="Created at"
                value={new Date(secret?.data?.created).toUTCString()}
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
                    <Badge className="tw-text-xs">
                      {secret?.data?.creator_id}
                    </Badge>
                  )}
                </DataGridCell>
              </DataGridRow>
              <Row
                label="Content Types"
                value={secret?.data?.content_types?.default}
              />
              <Row label="Bit Length" value={secret?.data?.bit_length} />
              <Row label="Algorithm" value={secret?.data?.algorithm} />
              <Row label="Mode" value={secret?.data?.mode} />
              <Row label="Status" value={secret?.data?.status} />
              <Row
                label="Expiration"
                value={new Date(secret?.data?.expiration).toUTCString()}
              />
              
              {/* Show link to generating order if found */}
              {generatingOrder && (
                <DataGridRow>
                  <DataGridHeadCell>Generated from Order</DataGridHeadCell>
                  <DataGridCell>
                    <div>
                      <Link
                        className="tw-break-all"
                        to={`/orders/${getOrderUuid(generatingOrder)}/show`}
                      >
                        {getOrderName(generatingOrder) || getOrderUuid(generatingOrder)}
                      </Link>
                      <br />
                      <Badge className="tw-text-xs">
                        {getOrderUuid(generatingOrder)}
                      </Badge>
                    </div>
                  </DataGridCell>
                </DataGridRow>
              )}
              
              <DataGridRow>
                <DataGridHeadCell>{"Payload"}</DataGridHeadCell>
                <DataGridCell>
                  <div>
                    <Button
                      icon="download"
                      label="Download"
                      onClick={handleDownload} // Trigger download on button click
                    />
                  </div>
                </DataGridCell>
              </DataGridRow>
            </DataGrid>
            {secretMetadata && (
              <CodeBlock
                heading="Secret Metadata"
                content={secretMetadata}
                lang="json"
                className="tw-mt-6"
              />
            )}
          </>
        ) : (
          <span>Secret {params?.id} not found</span>
        )}
      </PanelBody>
    </Panel>
  )
}

export default SecretDetails
