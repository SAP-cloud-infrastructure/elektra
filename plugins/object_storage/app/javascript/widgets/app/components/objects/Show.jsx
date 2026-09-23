import React from "react"
import PropTypes from "prop-types"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useHistory, useParams } from "react-router-dom"
import useActions from "../../hooks/useActions"
import { Unit } from "lib/unit"
import CustomMetaTags from "../shared/CustomMetatags"
import useUrlParamEncoder from "../../hooks/useUrlParamEncoder"
import { serviceEndpoint } from "../../lib/apiClient"

const unit = new Unit("B")

const dateToString = (date) => {
  if (!date) return ""
  const leadingZero = (value) => `${value < 10 ? "0" + value : value}`
  let month = leadingZero(date.getUTCMonth() + 1)
  let day = leadingZero(date.getUTCDate())
  let hours = leadingZero(date.getUTCHours())
  let minutes = leadingZero(date.getUTCMinutes())
  let seconds = leadingZero(date.getUTCSeconds())

  return `${date.getUTCFullYear()}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/
const stringToDate = (string) => {
  const match = string.match(dateRegex)
  if (!match) return null
  try {
    const date = new Date()
    date.setUTCFullYear(match[1])
    date.setUTCMonth(parseInt(match[2]) - 1)
    date.setUTCDate(match[3])
    date.setUTCHours(match[4])
    date.setUTCMinutes(match[5])
    if (match[6]) date.setSeconds(match[6])
    return date
  } catch (e) {
    console.log(e)
    return null
  }
}

const ShowObject = () => {
  const history = useHistory()
  let { name: containerName, objectPath, object } = useParams()
  const { loadContainerMetadata, loadObjectMetadata } = useActions()
  const [containerMetadata, setContainerMetadata] = React.useState()
  const { updateObjectMetadata } = useActions()

  const [show, setShow] = React.useState(true)
  const [error, setError] = React.useState()
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [metadata, setMetadata] = React.useState({})
  const [customTags, setCustomTags] = React.useState([])
  const [expiresAt, setExpiresAt] = React.useState("")
  const { getFileName } = useUrlParamEncoder(objectPath)
  const fileName = React.useMemo(
    () => getFileName(object),
    [object, getFileName]
  )

  const expiresAtDate = React.useMemo(
    () => stringToDate(expiresAt),
    [expiresAt]
  )

  React.useEffect(() => {
    loadContainerMetadata(containerName).then((metadata) => {
      setContainerMetadata(metadata)
    })
  }, [containerName, setContainerMetadata])

  const publicUrl = React.useMemo(() => {
    if (
      !containerMetadata ||
      !/[.]r:/.test(containerMetadata["x-container-read"])
    )
      return null

    return `${serviceEndpoint}/${decodeURIComponent(
      containerName
    )}/${decodeURIComponent(object)}`
  }, [containerMetadata, containerName, object])

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    loadObjectMetadata(containerName, object)
      .then((metadata) => {
        setMetadata(metadata)
        const customTags = []
        for (let key in metadata) {
          const match = key.match(/^x-object-meta-(.+)$/)
          if (match) {
            customTags.push({
              key: match[1],
              value: decodeURIComponent(metadata[key]),
            })
          }
        }

        if (metadata["x-delete-at"]) {
          setExpiresAt(
            dateToString(new Date(parseInt(metadata["x-delete-at"]) * 1000))
          )
        }
        setCustomTags(customTags)
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false))
  }, [containerName, object, loadObjectMetadata])

  const close = React.useCallback(() => {
    setError(null)
    setLoading(false)
    setMetadata({})
    setSubmitting(false)
    setShow(false)
  }, [])

  const back = React.useCallback(() => {
    let path = `/containers/${containerName}/objects`
    if (objectPath && objectPath !== "") path += `/${objectPath}`
    history.replace(path)
  }, [containerName, objectPath])

  const createdAt = React.useMemo(() => {
    let timestamp = metadata["x-timestamp"]
    if (!timestamp) return ""
    timestamp = parseInt(timestamp.split(".")[0]) * 1000
    return dateToString(new Date(timestamp))
  }, [metadata])

  const lastModifiedAt = React.useMemo(() => {
    let dateString = metadata["x-last-modified"]
    if (!dateString) return ""

    try {
      return dateToString(new Date(dateString))
    } catch (e) {
      return ""
    }
  }, [metadata])

  const expiresAtPlaceholder = React.useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)

    return `Enter a timestamp like "${dateToString(
      date
    )}" to schedule automatic deletion`
  }, [])

  const submit = React.useCallback(() => {
    if (!containerName || !object) return

    const values = {
      "content-type": metadata["x-content-type"] || metadata["content-type"],
    }
    if (expiresAtDate)
      values["x-delete-at"] = parseInt(expiresAtDate.getTime() / 1000)

    customTags
      .filter((t) => t.key !== "")
      .forEach(
        (t) => (values[`x-object-meta-${t.key}`] = encodeURIComponent(t.value))
      )

    setSubmitting(true)
    setError(null)
    updateObjectMetadata(containerName, object, values)
      .then(close)
      .catch((error) => {
        setError(error.message)
        setSubmitting(false)
      })
  }, [
    containerName,
    object,
    expiresAtDate,
    customTags,
    updateObjectMetadata,
    close,
    metadata,
  ])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="large"
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Properties of {fileName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert bsStyle="danger">
            <strong>An error has occurred</strong>
            <p>{error}</p>
          </Alert>
        )}
        {loading ? (
          <>
            <span className="spinner" /> Loading...
          </>
        ) : (
          <>
            <div className="form-horizontal">
              <div className="form-group">
                <label className="col-sm-2 control-label">Content type</label>
                <div className="col-sm-10">
                  <p className="form-control-static">
                    {metadata["x-content-type"] ||
                      metadata["content-type"] ||
                      ""}
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="col-sm-2 control-label">MD5 checksum</label>
                <div className="col-sm-10">
                  <p className="form-control-static">
                    {metadata["x-etag"] || metadata["etag"] || ""}
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="col-sm-2 control-label">Size</label>
                <div className="col-sm-10">
                  <p className="form-control-static">
                    {unit.format(
                      metadata["x-content-length"] ||
                        metadata["content-length"] ||
                        0
                    )}
                  </p>
                </div>
              </div>

              {/* Public URL */}
              {publicUrl && (
                <div className="form-group string ">
                  <label className="control-label col-sm-2 string">
                    URL for public access
                  </label>
                  <div className="col-sm-10" style={{ display: "flex" }}>
                    <p className="form-control-static">{publicUrl}</p>
                    <a
                      className="btn"
                      target="_blank"
                      href={publicUrl}
                      rel="noreferrer"
                    >
                      <i className="fa fa-external-link" />
                    </a>
                  </div>
                </div>
              )}

              {/* Upload date */}
              <div className="form-group">
                <label className="col-sm-2 control-label">Uploaded (UTC)</label>
                <div className="col-sm-10">
                  <p className="form-control-static">{createdAt}</p>
                </div>
              </div>

              {/* Last modification date */}
              <div className="form-group">
                <label className="col-sm-2 control-label">
                  Last modified (UTC)
                </label>
                <div className="col-sm-10">
                  <p className="form-control-static">{lastModifiedAt}</p>
                </div>
              </div>

              {/* Expiration until deletion */}
              <div
                className={`form-group ${
                  expiresAt === "" || expiresAtDate
                    ? ""
                    : "has-error has-feedback"
                }`}
              >
                <label className="col-sm-2 control-label">
                  Expires at (UTC)
                </label>
                <div className="col-sm-5">
                  <input
                    id="expiresat"
                    className="form-control string"
                    value={expiresAt}
                    placeholder={expiresAtPlaceholder}
                    type="text"
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  {expiresAt && expiresAt.length > 0 && (
                    <small className="info-text fade-in-info-text">
                      {expiresAtPlaceholder}
                    </small>
                  )}
                </div>
              </div>

              {/* DLO */}
              {metadata["x-object-manifest"] && (
                <div className="form-group">
                  <label className="col-sm-2 control-label">
                    Dynamic Large Object Manifest
                  </label>
                  <div className="col-sm-10">
                    <p className="form-control-static">
                      {metadata["x-object-manifest"]}
                    </p>
                  </div>
                </div>
              )}
              {/* SLO */}
              {metadata["x-static-large-object"] && (
                <div className="form-group">
                  <label className="col-sm-2 control-label">
                    Static Large Object
                  </label>
                  <div className="col-sm-10">
                    <p className="form-control-static">
                      {metadata["x-static-large-object"]}
                    </p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="control-label col-sm-2 string">
                  Metadata
                </label>
                <div className="col-sm-10">
                  <CustomMetaTags
                    values={customTags}
                    onChange={setCustomTags}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Cancel</Button>
        <Button
          bsStyle="primary"
          onClick={submit}
          data-test="Update object"
          disabled={
            !containerName ||
            !object ||
            loading ||
            submitting ||
            (expiresAt !== "" && !expiresAtDate)
          }
        >
          {submitting ? "Updating..." : "Update object"}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowObject
