import React from "react"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useHistory, useParams } from "react-router-dom"
import useActions from "../../hooks/useActions"
import { useGlobalState } from "../../StateProvider"

const DelteContainer = () => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const [confirmation, setConfirmation] = React.useState("")
  const [confirmDeleteVersions, setConfirmDeleteVersions] =
    React.useState(false)
  const [isDeleteing, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState()
  const containers = useGlobalState("containers")
  const headerRef = React.createRef()
  const confirmationRef = React.createRef()
  const { deleteContainer, getVersions, deleteVersion, loadContainerMetadata } =
    useActions()
  const [metadata, setMetadata] = React.useState()
  const [isFetchingMetadata, setIsFetchingMetadata] = React.useState(false)
  const versioningEnabled = React.useMemo(
    () =>
      metadata?.["x-versions-enabled"] === "True" ||
      metadata?.["x-versions-enabled"] === "true" ||
      metadata?.["x-versions-enabled"] === "1",
    [metadata]
  )

  const [versionsCount, setVersionsCount] = React.useState(0)
  const [deletedVersionsCount, setDeletedVersionsCount] = React.useState(0)
  const mounted = React.useRef()

  const container = React.useMemo(() => {
    if (!containers?.items) return
    return containers.items.find((c) => c.name === name)
  }, [containers, name])

  React.useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

  React.useEffect(() => {
    setIsFetchingMetadata(true)
    loadContainerMetadata(name)
      .then((headers) => setMetadata(headers))
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => setIsFetchingMetadata(false))
  }, [name, loadContainerMetadata, setMetadata, setIsFetchingMetadata])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  const submit = React.useCallback(
    (e) => {
      if (e && e.preventDefault) e.preventDefault()
      if (!container || container.name !== confirmation) return

      // Since the switch to the new version management in Swift API ("x-versions-enabled" header),
      // versions are stored hidden. If the customer has activated this option, he can no longer
      // delete the container via the UI.
      // Solution: we check whether this option is enabled and delete the corresponding versions
      // individually (n+1 problem :( )
      const deleteContainerAndVersions = async () => {
        // reset error
        setError(null)
        // mark as deleting
        setIsDeleting(true)

        // check if delete versions was confirmed
        // we also check if this component still mounted to prevent update errors
        if (confirmDeleteVersions && mounted.current) {
          // if versions have to be deleted then replace promise with api call
          // wait until versions are deleted
          const versions = await getVersions(container.name)
          // to preserve performance, we allow up to 1000 versions to be deleted via UI
          if (versions.length > 1000) {
            setError(
              `There are more than 1000 versions. Please use the swift client instead (easiest way is to use our webconsole):   
              "swift delete ${container.name} --versions" `
            )
            // reset deleting state
            setIsDeleting(false)
            // stop here
            return
          }
          // set count of all versions
          setVersionsCount(versions.length)
          for (let i = 0; i < versions.length; i++) {
            if (!mounted.current) continue
            // wait for deleting this version
            await deleteVersion(container.name, versions[i])
            // increase deleted count
            setDeletedVersionsCount(i + 1)
          }
        }
        if (mounted.current) {
          // delete container
          await deleteContainer(container.name)
            .then(close)
            .catch((error) => {
              if (error.status === 409)
                setError(
                  "Cannot delete container because it contains objects. Please empty it first."
                )
              else mounted.current && setError(error.message)
              mounted.current && setIsDeleting(false)
            })
        }
      }

      deleteContainerAndVersions()
    },
    [
      confirmation,
      container,
      deleteContainer,
      getVersions,
      deleteVersion,
      confirmDeleteVersions,
    ]
  )

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
          Delete container: <span ref={headerRef}>{container?.name}</span>{" "}
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
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {containers.isFetching || isFetchingMetadata ? (
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
            {container.count > 0 ? (
              <div className="bs-callout bs-callout-danger">
                <span className="fa fa-exclamation-circle"></span> Cannot delete
                Container contains objects. Please empty it first.
              </div>
            ) : (
              <>
                <div className="bs-callout bs-callout-danger">
                  <span className="fa fa-exclamation-circle" />{" "}
                  <strong>Are you sure?</strong> The container will be deleted.
                  This cannot be undone.
                </div>

                {/* support the new versioning method. Delete versions if x-versions-enabled header is set. */}
                {versioningEnabled && (
                  <div className="row">
                    <div
                      className={`col-md-6 ${
                        confirmation && confirmDeleteVersions
                          ? "has-success"
                          : "has-error"
                      }`}
                    >
                      <div className="checkbox">
                        <label>
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              setConfirmDeleteVersions(e.target.checked)
                            }
                          />{" "}
                          I confirm that all existing versions will also be
                          deleted
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row">
                  <div
                    className={`col-md-6 ${
                      confirmation && container?.name !== confirmation
                        ? "has-error"
                        : ""
                    }`}
                  >
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

                    {isDeleteing && (
                      <span>
                        Deleting <span className="spinner" />{" "}
                        {versionsCount > 0 && (
                          <>
                            {Math.round(
                              (deletedVersionsCount / versionsCount) * 100
                            )}
                            %
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {container ? (
          container.count <= 0 ? (
            <>
              <Button onClick={close}>Cancel</Button>

              <Button
                bsStyle="primary"
                onClick={submit}
                disabled={
                  !container ||
                  container.name !== confirmation ||
                  isDeleteing ||
                  (versioningEnabled && !confirmDeleteVersions)
                }
              >
                {isDeleteing ? "Deleting..." : "Delete"}
              </Button>
            </>
          ) : (
            <Button onClick={close}>Got it!</Button>
          )
        ) : (
          <Button onClick={close}>Cancel</Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default DelteContainer
