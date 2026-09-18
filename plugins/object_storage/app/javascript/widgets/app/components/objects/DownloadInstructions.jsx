import React from "react"
import PropTypes from "prop-types"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useHistory, useParams } from "react-router-dom"
import useActions from "../../hooks/useActions"
import { Unit } from "lib/unit"
import { LIMIT } from "./config"
import { serviceEndpoint } from "../../lib/apiClient"
const unit = new Unit("B")

const LargeFileInstruction = ({}) => {
  const history = useHistory()
  const [show, setShow] = React.useState(true)
  let { name: containerName, objectPath, object: name } = useParams()
  const [authToken, setAuthToken] = React.useState()
  const { getAuthToken } = useActions()
  const codeRef = React.createRef()
  const [showCopyInfo, setShowCopyInfo] = React.useState(false)

  React.useEffect(() => {
    if (authToken) return
    getAuthToken().then((token) => setAuthToken(token))
  }, [authToken, getAuthToken])

  React.useEffect(() => {
    if (!showCopyInfo) return
    let active = true
    setTimeout(() => active && setShowCopyInfo(false), 2000)
    return () => (active = false)
  }, [showCopyInfo, setShowCopyInfo])

  const close = React.useCallback(() => {
    setShow(false)
  }, [])

  const back = React.useCallback(() => {
    let path = `/containers/${containerName}/objects`
    if (objectPath && objectPath !== "") path += `/${objectPath}`
    history.replace(path)
  }, [containerName, objectPath])

  const copyToClipboard = React.useCallback(() => {
    if (!codeRef.current || !authToken) return
    var text = (codeRef.current.innerText || "").replace("$token", authToken)
    navigator.clipboard.writeText(text).then(
      () => {
        console.log("Async: Copying to clipboard was successful!", text)
        setShowCopyInfo(true)
      },
      (err) => {
        console.error("Async: Could not copy text: ", err)
      }
    )
  }, [codeRef, setShowCopyInfo, authToken])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="large"
      // dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Instructions for downloading large file
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div>
          {!authToken ? (
            <>
              <span className="spinner" /> Loading...
            </>
          ) : (
            <>
              <p>
                This file is larger than <strong>{unit.format(LIMIT)}</strong>.
                You can download it using:
              </p>
              <p ref={codeRef}>
                <code>
                  curl "
                  {serviceEndpoint +
                    "/" +
                    decodeURIComponent(containerName + "/" + name)}
                  " -X GET -H "X-Auth-Token: $token" --output {name}
                </code>
              </p>

              <div className="text-right">
                {showCopyInfo && (
                  <>
                    <span className="fade-in-info-text reverse">
                      copied to clipboard
                    </span>{" "}
                  </>
                )}
                {authToken && (
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={(e) => copyToClipboard()}
                  >
                    Copy
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default LargeFileInstruction
