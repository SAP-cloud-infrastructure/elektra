import React from "react"
import PropTypes from "prop-types"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useHistory, useParams } from "react-router-dom"
import useUrlParamEncoder from "../../hooks/useUrlParamEncoder"
import useActions from "../../hooks/useActions"

const NewObject = ({ onCreated }) => {
  const history = useHistory()
  let { name: containerName, objectPath } = useParams()
  const { value: currentPath } = useUrlParamEncoder(objectPath)
  const [show, setShow] = React.useState(true)
  const [processing, setProcessing] = React.useState(false)
  const [error, setError] = React.useState()
  const [name, setName] = React.useState("")
  const { createFolder } = useActions()
  const [valid, setValid] = React.useState(true)
  const close = React.useCallback(() => setShow(false), [])

  const back = React.useCallback(() => {
    let path = `/containers/${containerName}/objects`
    if (objectPath) path += `/${objectPath}`
    history.replace(path)
  }, [containerName, objectPath])

  const validateAndSetName = React.useCallback(
    (value) => {
      const match = value.match(/^(\/*)([^/]*)(\/*)$/)
      setValid(match && match[1] === "" && match[3] === "")
      setName(match ? match[2] : value)
    },
    [setName, setValid]
  )

  const submit = React.useCallback(() => {
    setError(null)
    setProcessing(true)
    createFolder(containerName, currentPath, name)
      .then((item) => onCreated && onCreated({ ...item, display_name: name }))
      .then(close)
      .catch((error) => {
        setError(error.message)
        setProcessing(false)
      })
  }, [close, containerName, currentPath, name])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Create folder below: /{currentPath}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert bsStyle="danger">
            <strong>An error has occurred</strong>
            <p>{error}</p>
          </Alert>
        )}

        <div className="row">
          <div className="col-md-6">
            <fieldset>
              <div className="form-group string required forms_confirm_container_action_name">
                <label
                  className="control-label string required"
                  htmlFor="confirmation"
                >
                  <abbr title="required">*</abbr> Type container name
                </label>
                <input
                  className="form-control string required"
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => validateAndSetName(e.target.value)}
                />
                {!valid && (
                  <span className="fade-in-text  text-danger">
                    Slashes at the beginning or end are not allowed.
                  </span>
                )}
              </div>
            </fieldset>
            {processing && <span className="spinner" />}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Cancel</Button>
        <Button
          bsStyle="primary"
          onClick={submit}
          disabled={!name || processing}
        >
          {processing ? "Creating..." : "Create folder"}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

NewObject.propTypes = {
  onCreated: PropTypes.func,
}

export default NewObject
