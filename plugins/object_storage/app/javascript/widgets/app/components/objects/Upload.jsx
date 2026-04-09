import React from "react"
import PropTypes from "prop-types"
import { Modal, Button, Alert } from "react-bootstrap"
import { useHistory, useParams } from "react-router-dom"
import useUrlParamEncoder from "../../hooks/useUrlParamEncoder"
import { Unit } from "lib/unit"
import useActions from "../../hooks/useActions"
import { LIMIT } from "./config"
import { serviceEndpoint } from "../../lib/apiClient"
const unit = new Unit("B")

const UploadFile = ({ refresh }) => {
  const history = useHistory()
  let { name: containerName, objectPath } = useParams()
  const { value: currentPath } = useUrlParamEncoder(objectPath)
  const [show, setShow] = React.useState(true)
  const [error, setError] = React.useState()
  const [submitting, setSubmitting] = React.useState(false)
  const [file, setFile] = React.useState()
  const [fileName, setFileName] = React.useState()
  const { getAuthToken, uploadObject } = useActions()
  const codeRef = React.createRef()
  const [authToken, setAuthToken] = React.useState()
  const [showCopyInfo, setShowCopyInfo] = React.useState(false)

  React.useEffect(() => {
    if (!file || file.size <= LIMIT || !!authToken) return
    getAuthToken().then((token) => setAuthToken(token))
  }, [authToken, file, getAuthToken])

  React.useEffect(() => {
    if (!showCopyInfo) return
    let active = true
    setTimeout(() => active && setShowCopyInfo(false), 2000)
    return () => (active = false)
  }, [showCopyInfo, setShowCopyInfo])

  const close = React.useCallback(() => {
    setError(null)
    setSubmitting(false)
    setShow(false)
  }, [])

  const back = React.useCallback(() => {
    let path = `/containers/${containerName}/objects`
    if (objectPath && objectPath !== "") path += `/${objectPath}`
    history.replace(path)
  }, [containerName, objectPath])

  const valid = React.useMemo(() => file && fileName && file.size <= LIMIT, [file, fileName])

  const handleFileSelect = React.useCallback(
    (file) => {
      setFile(file)
      setFileName(file.name)
    },
    [setFile, setFileName]
  )

  const copyToClipboard = React.useCallback(() => {
    if (!codeRef.current || !authToken) return
    var text = (codeRef.current.innerText || "").replace("$token", authToken)
    navigator.clipboard.writeText(text).then(
      function () {
        console.log("Async: Copying to clipboard was successful!", text)
        setShowCopyInfo(true)
      },
      function (err) {
        console.error("Async: Could not copy text: ", err)
      }
    )
  }, [codeRef, setShowCopyInfo, authToken])

  const submit = React.useCallback(() => {
    if (!file) return

    setSubmitting(true)
    uploadObject(containerName, currentPath, fileName, file)
      .then(() => refresh && refresh())
      .then(close)
      .catch((error) => {
        setError(error.message)
        setSubmitting(false)
      })
  }, [containerName, fileName, file, close, uploadObject, setSubmitting, setError])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
      // dialogClassName="modal-xl"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Upload file to /{containerName}/{currentPath}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert bsStyle="danger">
            <strong>An error has occurred</strong>
            <p>{error}</p>
          </Alert>
        )}
        <div className="bs-callout bs-callout-info">
          {!file || file.size <= LIMIT ? (
            <p>
              This dialog only accepts files <strong>smaller than {unit.format(LIMIT)}.</strong> To upload larger files,
              please use a different client.
            </p>
          ) : (
            <>
              <p>
                This file is larger than <strong>{unit.format(LIMIT)}</strong> ({unit.format(file.size)}). You can
                upload it using:
              </p>
              <p ref={codeRef}>
                <code>
                  curl -T {file.name} -X PUT "{serviceEndpoint}/{decodeURIComponent(containerName)}/
                  {currentPath ? `${decodeURIComponent(currentPath)}` : ""}
                  {decodeURIComponent(fileName)}" -H "X-Auth-Token: $token"
                </code>
              </p>

              <div className="text-right">
                {showCopyInfo && (
                  <>
                    <span className="fade-in-info-text reverse">copied to clipboard</span>{" "}
                  </>
                )}
                {authToken && (
                  <button className="btn btn-xs" onClick={(e) => copyToClipboard()}>
                    Copy
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="form-horizontal">
          <div className="form-group">
            <label className="col-sm-2 control-label">
              <abbr title="required">*</abbr> Select file
            </label>
            <div className="col-sm-10">
              <input className="file required" type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
            </div>
          </div>

          <div className="form-group">
            <label className="col-sm-2 control-label">
              <abbr title="required">*</abbr> File name
            </label>
            <div className="col-sm-10">
              <input
                className="form-control string required"
                type="text"
                value={fileName || ""}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Cancel</Button>
        <Button bsStyle="primary" onClick={submit} disabled={!valid || submitting}>
          Upload
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

UploadFile.propTypes = {
  refresh: PropTypes.func,
}

export default UploadFile
