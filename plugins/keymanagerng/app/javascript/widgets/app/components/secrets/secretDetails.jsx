import React, { useEffect, useState, useCallback } from "react"
import { useHistory, useLocation, useParams } from "react-router-dom"
import { getSecretUuid } from "../../../lib/secretHelper"
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
} from "juno-ui-components"
import {
  getSecret,
  getSecretMetadata,
  getSecretPayload,
} from "../../secretActions"
import { getUsername } from "../../helperActions"
import { useQuery } from "@tanstack/react-query"
import HintLoading from "../HintLoading"
import { Message } from "juno-ui-components"

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

  const secret = useQuery(["secret", params.id], getSecret, {
    enabled: !!params.id,
  })
  //Todo: find how to can rename data directly there as secret

  const [show, setShow] = useState(!!secret?.data)

  useEffect(() => {
    if (secret?.data?.secret_ref) {
      const newSecretId = getSecretUuid(secret?.data)
      setSecretId(newSecretId)
    }
  }, [secret?.data?.secret_ref])

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

  const isDownloadableDataType = (contentType) => {
    const downloadableTypes = [
      "application/octet-stream",
      "application/pkcs8",
      "application/pkix-cert",
    ]
    return downloadableTypes.includes(contentType)
  }

  const secretPlayload = useQuery({
    queryKey: [
      "secretPlayload",
      secretId,
      secret?.data?.content_types?.default,
    ],
    queryFn: getSecretPayload,
    enabled:
      payloadRequested || // Enable when download requested
      (show && !isDownloadableDataType(secret?.data?.content_types?.default)), // Enable for text/plain content types when panel is shown
    onSuccess: (data) => {
      if (isDownloadableDataType(secret?.data?.content_types?.default)) {
        // Handle specific payload types by downloading the content as a file
        const fileData = JSON.stringify(data)
        const blob = new Blob([fileData], {
          type: secret?.data?.content_types?.default,
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = secret?.data?.name
        link.href = url
        link.click()
        setPayloadRequested(false)
      } else {
        // Handle payload types other than specific ones by returning as a string
        setPayloadString(data)
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
                    <Badge className="tw-display-inline">
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
              <DataGridRow>
                <DataGridHeadCell>{"Payload"}</DataGridHeadCell>
                <DataGridCell>
                  <div>
                    {isDownloadableDataType(
                      secret?.data?.content_types?.default
                    ) ? (
                      <Button
                        icon="download"
                        label="Download"
                        onClick={handleDownload} // Trigger download on button click
                      />
                    ) : payloadString ? (
                      // Show payload text if content types are not for downloading and payload exists
                      <span>{payloadString}</span>
                    ) : (
                      // Show no payload message when no file to download and no payload text available
                      <span>No payload available</span>
                    )}
                  </div>
                </DataGridCell>
              </DataGridRow>
            </DataGrid>
            {metadata?.isLoading && !metadata?.data ? (
              <HintLoading />
            ) : metadata?.data ? (
              <CodeBlock
                heading="Metadata"
                content={secretMetadata || {}}
                lang="json"
                className="tw-mt-6"
              />
            ) : (
              <span>Metadata is not found</span>
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
