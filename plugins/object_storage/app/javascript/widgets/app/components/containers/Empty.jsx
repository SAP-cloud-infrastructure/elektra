import React from "react"
import { Modal, Button, Alert } from "react-bootstrap"
import { useHistory, useParams } from "react-router-dom"
import useActions from "../../hooks/useActions"
import { useGlobalState } from "../../StateProvider"

const EmptyContainer = () => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const [confirmation, setConfirmation] = React.useState("")
  const [beingEmptied, setBeingEmptied] = React.useState(false)
  const [error, setError] = React.useState()
  const { containers, capabilities } = useGlobalState()
  const { loadContainerObjects, deleteObjects } = useActions()
  const [progress, setProgress] = React.useState(0)
  const headerRef = React.createRef()
  const confirmationRef = React.createRef()

  const container = React.useMemo(() => {
    if (!containers?.items) return {}
    return containers.items.find((c) => c.name === name) || {}
  }, [containers, name])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  const [empty, cancelEmpty] = React.useMemo(() => {
    let active = true

    // this is the function which deletes all objects inside the container
    const action = (e) => {
      if (e && e.preventDefault) e.preventDefault()
      if (!container || container.name !== confirmation) return

      // This function deletes all objects of the container.
      // Since the number of objects to be loaded and deleted is limited,
      // we delete the objects in chunks.
      const deleteAllObjects = async () => {
        let marker
        let deletedCount = 0
        let processing = true
        // We load objects, delete them and repeat this process until there are no more objects
        // This is done to avoid loading too many objects at once and hitting API limits
        // Only one request is made at a time
        while (active && processing) {
          await loadContainerObjects(container.name, {
            marker,
          }).then(async ({ data }) => {
            if (data.length > 0 && active) {
              await deleteObjects(container.name, data)
              setProgress((deletedCount += data.length))
              marker = data.pop().name
            } else {
              processing = false
            }
          })
        }
      }

      setProgress(0)
      setBeingEmptied(true)
      setError(null)
      deleteAllObjects()
        .then(() => active && close())
        .catch((error) => {
          if (!active) return
          setError(error.message)
          setBeingEmptied(false)
        })
    }

    // return the actual action and a cancel function to cancel the delete process for large containers
    return [action, () => (active = false)]
  }, [
    confirmation,
    setProgress,
    setError,
    setBeingEmptied,
    loadContainerObjects,
    deleteObjects,
    capabilities,
  ])

  React.useEffect(() => {
    return () => {
      if (cancelEmpty) cancelEmpty()
    }
  }, [cancelEmpty])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="lg"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Empty container: <span ref={headerRef}>{container?.name}</span>{" "}
          {container.count > 0 && (
            <small>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!headerRef.current || !confirmationRef.current) return
                  confirmationRef.current.value = headerRef.current.textContent
                  setConfirmation(headerRef.current.textContent)
                }}
              >
                <i className="fa fa-clone" />
              </a>
            </small>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {containers.isFetching ? (
          <span>
            <span className="spinner" />
            Loading...
          </span>
        ) : !container ? (
          <span>Container not found!</span>
        ) : (
          <>
            {error && (
              <Alert bsStyle="danger">
                <strong>An error has occurred</strong>
                <p>{error}</p>
              </Alert>
            )}
            {container.count <= 0 ? (
              <div className="bs-callout bs-callout-info">
                <span className="fa fa-exclamation-circle"></span> Nothing to
                do. Container is already empty.
              </div>
            ) : (
              <>
                <div className="bs-callout bs-callout-danger">
                  <span className="fa fa-exclamation-circle" />
                  <strong> Are you sure?</strong> All objects in the container
                  will be deleted. This cannot be undone.
                  <br />
                  <small style={{ marginLeft: 15 }}>
                    Please note: for
                    <strong> dynamic </strong> and
                    <strong> static large objects </strong>only the manifests
                    are deleted. The related segments are not deleted.
                  </small>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <fieldset>
                      <div className="form-group string required forms_confirm_container_action_name">
                        <label
                          className="control-label string required"
                          htmlFor="confirmation"
                        >
                          <abbr title="required">*</abbr> Type container name to
                          confirm
                        </label>
                        <input
                          ref={confirmationRef}
                          className="form-control string required"
                          autoFocus
                          type="text"
                          value={confirmation}
                          name="confirmation"
                          onChange={(e) => setConfirmation(e.target.value)}
                        />
                      </div>
                    </fieldset>
                    {beingEmptied && progress >= 0 && container && (
                      <>
                        <span>
                          Deleted:{" "}
                          {parseFloat(
                            (progress / container.count) * 100
                          ).toFixed(2)}
                          %{" "}
                          <small className="info-text">
                            ( {progress} / {container.count} )
                          </small>{" "}
                          <span className="spinner" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {container.count === 0 ? (
          <Button onClick={close}>Got it!</Button>
        ) : (
          <>
            <Button onClick={close}>Cancel</Button>

            <Button
              bsStyle="primary"
              onClick={empty}
              disabled={
                !container || container.name !== confirmation || beingEmptied
              }
            >
              {beingEmptied ? "Empting..." : "Empty"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default EmptyContainer
