import React from "react"
import PropTypes from "prop-types"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useHistory, useParams } from "react-router-dom"
import useActions from "../../hooks/useActions"
import Select from "react-select"
import { useGlobalState } from "../../StateProvider"
import useUrlParamEncoder from "../../hooks/useUrlParamEncoder"

const CopyObject = ({ showCopyMetadata, deleteAfter, refresh }) => {
  const history = useHistory()
  let { name: containerName, objectPath, object: objectName } = useParams()
  const containers = useGlobalState("containers")
  const { loadContainersOnce, copyObject, deleteObject } = useActions()

  const [show, setShow] = React.useState(true)
  const [copyMetadata, setCopyMetadata] = React.useState(true)
  const [error, setError] = React.useState()
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [targetContainer, setTargetContainer] = React.useState(containerName)
  const [newObjectPath, setNewObjectPath] = React.useState(
    decodeURIComponent(objectName)
  )
  const { getFileName } = useUrlParamEncoder(objectPath)
  const fileName = React.useMemo(
    () => getFileName(objectName),
    [objectName, getFileName]
  )

  React.useEffect(() => {
    setLoading(true)

    loadContainersOnce()
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false))
  }, [loadContainersOnce, containerName, objectName])

  const back = React.useCallback(() => {
    let path = `/containers/${containerName}/objects`
    if (objectPath && objectPath !== "") path += `/${objectPath}`
    history.replace(path)
  }, [containerName, objectPath])

  const close = React.useCallback(() => {
    setError(null)
    setLoading(false)
    setSubmitting(false)
    setShow(false)
  }, [])

  const submit = React.useCallback(() => {
    if (!containerName || !objectName) return

    setError(null)
    setSubmitting(true)
    copyObject(
      containerName,
      objectName,
      {
        container: targetContainer,
        path: newObjectPath,
      },
      { withMetadata: copyMetadata !== false }
    )
      .then(() => deleteAfter && deleteObject(containerName, objectName))
      .then(
        () =>
          (deleteAfter || containerName === targetContainer) &&
          refresh &&
          refresh()
      )
      .then(close)
      .catch((error) => {
        setError(error.message)
        setSubmitting(false)
      })
  }, [
    containerName,
    objectName,
    targetContainer,
    newObjectPath,
    close,
    deleteObject,
    copyMetadata,
  ])

  const label = React.useMemo(
    () => ({
      text: deleteAfter
        ? containerName === targetContainer
          ? "Rename"
          : "Move"
        : "Copy",
      processing: deleteAfter
        ? containerName === targetContainer
          ? "Renaming"
          : "Moving"
        : "Copying",
    }),
    [containerName, targetContainer]
  )

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
          <fieldset>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group select required">
                  <label className="control-label select required">
                    <abbr title="required">*</abbr> Target container
                  </label>
                  <Select
                    className="basic-single"
                    classNamePrefix="select"
                    isDisabled={false}
                    isSearchable={true}
                    isLoading={containers.isFetching}
                    isMulti={false}
                    value={{
                      value: targetContainer || "",
                      label: targetContainer || "",
                    }}
                    onChange={(item) => setTargetContainer(item.value)}
                    options={containers.items.map((i) => ({
                      value: i.name,
                      label: decodeURIComponent(i.name),
                    }))}
                    closeMenuOnSelect={true}
                    placeholder="Select the target container"
                  />
                </div>
              </div>
              <div className="col-md-8">
                <div className="form-group string required">
                  <label className="control-label string required">
                    <abbr title="required">*</abbr> Target path
                  </label>
                  <input
                    className="form-control string required"
                    autoFocus
                    type="text"
                    value={newObjectPath}
                    onChange={(e) => setNewObjectPath(e.target.value)}
                  />
                  {showCopyMetadata && (
                    <div className="form-group boolean optional">
                      <div className="checkbox">
                        <label className="boolean optional">
                          <input
                            className="boolean optional"
                            type="checkbox"
                            value="1"
                            checked={copyMetadata}
                            onChange={(e) => setCopyMetadata(e.target.checked)}
                          />
                          Copy metadata
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </fieldset>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Cancel</Button>
        <Button
          bsStyle="primary"
          onClick={submit}
          disabled={!containerName || !objectName || loading || submitting}
        >
          {submitting ? `${label.processing}...` : `${label.text} object`}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

CopyObject.propTypes = {
  refresh: PropTypes.func,
  showCopyMetadata: PropTypes.bool,
  deleteAfter: PropTypes.bool,
}

export default CopyObject
