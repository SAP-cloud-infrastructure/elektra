import React from "react"
import PropTypes from "prop-types"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { useHistory, useParams } from "react-router-dom"
import { Form } from "lib/elektra-form"
import { useGlobalState } from "../../StateProvider"

import { createUseStyles } from "react-jss"
import AclResolution from "./AclResolution"
import useActions from "../../hooks/useActions"

const useStyles = createUseStyles({
  infoCallout: {
    marginBottom: 10,
  },
  dd: {
    marginLeft: "2rem",
  },
  dt: {
    marginTop: 10,
  },
})

const newLineRegex = new RegExp("(?:\r\n|\r|\n)", "g")

const FormBody = ({ staticweb, checkAcls }) => {
  const { formValues: values, onChange } = React.useContext(Form.Context)
  const classes = useStyles()

  const handlePublicReadAccess = React.useCallback((e) => {
    const isChecked = e.target.checked
    onChange({
      read: isChecked ? ".r:*,\n.rlistings" : "",
      public_read_access: isChecked,
    })
  }, [])

  return (
    <>
      <div className="row">
        <div className="col-md-6">
          <div className="loading-place loading-right">
            <Form.Element label="Read ACLs" name="read" inline>
              <Form.Input
                disabled={values.public_read_access}
                elementType="textarea"
                type="text"
                name="read"
                rows={4}
              />
            </Form.Element>
            {staticweb && (
              <div className="checkbox">
                <label>
                  <Form.Input
                    elementType="input"
                    type="checkbox"
                    name="public_read_access"
                    onChange={handlePublicReadAccess}
                  />{" "}
                  Public Read Access
                </label>
              </div>
            )}
            <Form.Element label="Write ACLs" name="write" inline>
              <Form.Input
                elementType="textarea"
                type="text"
                name="write"
                rows={4}
              />
            </Form.Element>

            <button type="button" onClick={() => checkAcls(values)}>
              Check ACLs
            </button>
            {/* 
      // = link_to 'Check ACLs' , '#', class: 'btn btn-default pull-right', id: 'check_acls'  */}
          </div>
        </div>
        <div className="col-md-6">
          <div className={`bs-callout bs-callout-info ${classes.infoCallout}`}>
            <p>Entries in ACLs are comma-separated. Examples:</p>
            <dl>
              <dt className={classes.dt}>
                <code>.r:*</code>
              </dt>
              <dd className={classes.dd}>
                Any user has read access to objects. No token is required in the
                request.
              </dd>
              <dt className={classes.dt}>
                <code>.rlistings</code>
              </dt>
              <dd className={classes.dd}>
                Any user can perform a HEAD or GET operation on the container
                provided the user also has read access on objects. No token is
                required.
              </dd>
              <dt className={classes.dt}>
                <code>PROJECT_ID:USER_ID</code>
              </dt>
              <dd className={classes.dd}>
                Grant access to a user from a different project.
              </dd>
              <dt className={classes.dt}>
                <code>PROJECT_ID:*</code>
              </dt>
              <dd className={classes.dd}>
                Grant access to all users from that project.
              </dd>
              <dt className={classes.dt}>
                <code>*:USER_ID</code>
              </dt>
              <dd className={classes.dd}>
                The specified user has access. A token for the user (scoped to
                any project) must be included in the request.
              </dd>
            </dl>
            <p>
              For more details, have a look at the{" "}
              <a
                href="https://docs.openstack.org/swift/latest/overview_acl.html#container-acls"
                target="_blank"
                rel="noreferrer"
              >
                documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

FormBody.propTypes = { staticweb: PropTypes.object, checkAcls: PropTypes.func }

const ContainerAccessControl = () => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const [error, setError] = React.useState()
  const capabilities = useGlobalState("capabilities")
  const [metadata, setMetadata] = React.useState()
  const [isFetchingMetadata, setIsFetchingMetadata] = React.useState(false)
  const [aclCheckResult, setAclCheckResult] = React.useState()
  const [isCheckingAcls, setIsCheckingAcls] = React.useState(false)
  const { loadContainerMetadata, updateContainerMetadata, getAcls } =
    useActions()

  React.useEffect(() => {
    setIsFetchingMetadata(true)
    loadContainerMetadata(name)
      .then((headers) => setMetadata(headers))
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => setIsFetchingMetadata(false))
  }, [name, loadContainerMetadata, setMetadata, setIsFetchingMetadata])

  const checkAcls = React.useCallback(
    ({ read, write }) => {
      setIsCheckingAcls(true)
      getAcls({ read, write })
        .then((data) => setAclCheckResult(data))
        .catch((error) => {
          setError(error.message)
        })
        .finally(() => setIsCheckingAcls(false))
    },
    [getAcls, setAclCheckResult, setIsCheckingAcls]
  )

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  const initialValues = React.useMemo(() => {
    if (!metadata) return {}
    return {
      read: metadata["x-container-read"],
      public_read_access: metadata["x-container-read"] === ".r:*,.rlistings",
      write: metadata["x-container-write"],
    }
  }, [metadata])

  const submit = React.useCallback(
    (values) => {
      if (!metadata) return Promise.reject("Could not find container")

      let newValues = {
        "x-container-read": (values.read || "").replace(newLineRegex, ""),
        "x-container-write": (values.write || "").replace(newLineRegex, ""),
      }

      return updateContainerMetadata(name, newValues)
        .then(close)
        .catch((error) => {
          setError(error.message)
        })
    },
    [metadata, close, name, setError, updateContainerMetadata]
  )

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="lg"
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Access Control for container: {name}
        </Modal.Title>
      </Modal.Header>

      <Form
        onSubmit={submit}
        className="form"
        validate={() => true}
        initialValues={initialValues}
      >
        <Modal.Body>
          {isFetchingMetadata ? (
            <span>
              <span className="spinner" />
              Loading...
            </span>
          ) : !metadata ? (
            <span>Container not found!</span>
          ) : error ? (
            <Alert bsStyle="danger">{error}</Alert>
          ) : (
            <FormBody
              staticweb={capabilities.data?.staticweb}
              checkAcls={checkAcls}
            />
          )}
          {isCheckingAcls ? (
            <span>
              <span className="spinner" />
              Checking ACLs...
            </span>
          ) : (
            aclCheckResult && (
              <>
                <AclResolution acls={aclCheckResult.read} title="Read ACLs" />
                <AclResolution acls={aclCheckResult.write} title="Write ACLs" />
              </>
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          {metadata && <Form.SubmitButton label="Save" />}
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ContainerAccessControl
