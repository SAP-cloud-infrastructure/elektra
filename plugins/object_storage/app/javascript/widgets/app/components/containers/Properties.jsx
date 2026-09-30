import React from "react"
import PropTypes from "prop-types"
import { Button, Alert } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { useHistory, useParams, Link } from "react-router-dom"
import { useGlobalState } from "../../StateProvider"
import { Unit } from "lib/unit"
import useActions from "../../hooks/useActions"
import CustomMetaTags from "../shared/CustomMetatags"
import { serviceEndpoint } from "../../lib/apiClient"
const unit = new Unit("B")

const FormBody = ({ containerName, otherContainers }) => {
  const { formValues: values, onChange } = React.useContext(Form.Context)

  return (
    <>
      <div className="row">
        <div className="col-md-6">
          <Form.Element label="Object count" name="object_count" inline>
            <Form.Input
              disabled
              elementType="input"
              type="text"
              name="object_count"
            />
          </Form.Element>
          <Form.Element label="Total size" name="total_size" inline>
            <Form.Input
              disabled
              elementType="input"
              type="text"
              name="total_size"
            />
          </Form.Element>
        </div>
        <div className="col-md-6">
          <Form.Element
            label="Object count quota"
            name="meta_quota_count"
            inline
          >
            <Form.Input
              placeholder="Leave empty to disable"
              elementType="input"
              type="number"
              name="meta_quota_count"
            />
          </Form.Element>
          <Form.Element label="Total size quota" name="meta_quota_bytes" inline>
            <Form.Input
              placeholder="Leave empty to disable"
              elementType="input"
              type="text"
              name="meta_quota_bytes"
            />
            {values.meta_quota_bytes && (
              <small className="text-info">
                {unit.format(values.meta_quota_bytes)}
              </small>
            )}
          </Form.Element>
        </div>
      </div>
      {/[.]r:/.test(values.read) && (
        <>
          <label className="control-label">
            URL for public access{" "}
            <a href={values.public_url} target="_blank" rel="noreferrer">
              (Open in new tab)
            </a>
          </label>
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              disabled
              defaultValue={values.public_url}
            />
          </div>
        </>
      )}
      {values.cap_staticweb && (
        <div className="form-group">
          <label>Static website serving</label>
          {values.read == ".r:*,.rlistings" ? (
            <>
              <div className="row">
                <div className="col-md-6">
                  <div className="checkbox">
                    <label>
                      <Form.Input
                        elementType="input"
                        type="checkbox"
                        name="meta_web_index_enabled"
                      />{" "}
                      Serve objects as{" "}
                      {values.meta_web_index.replace(".html", "")}
                      {values.meta_web_index_enabled && " when file name is:"}
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  {values.meta_web_index_enabled && (
                    <Form.Input
                      elementType="input"
                      type="text"
                      name="meta_web_index"
                    />
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="checkbox">
                    <label>
                      <Form.Input
                        elementType="input"
                        type="checkbox"
                        name="meta_web_listings"
                      />{" "}
                      Enable file listing{" "}
                      <i
                        className="fa fa-question-circle help_icon"
                        title="If there is no index file, the URL displays a list of objects in the container."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bs-callout bs-callout-info">
              Before configuring static website serving, go to{" "}
              <Link to={`/containers/${containerName}/access-control`}>
                Access control
              </Link>{" "}
              and enable public read access.
            </div>
          )}
        </div>
      )}
      <div className="form-group">
        {/* support new versioning. If enabled then hide old versioning method  */}
        {values.versions_enabled ? (
          <div className="row">
            <div className="col-md-6">
              <i className="fa fa-check-square-o" /> Versioning is enabled
            </div>
          </div>
        ) : (
          <>
            <label>Object versioning</label>

            <div className="row">
              <div className="col-md-6">
                <div className="checkbox">
                  <label>
                    <Form.Input
                      elementType="input"
                      type="checkbox"
                      name="versions_location_enabled"
                    />{" "}
                    Store old object versions{" "}
                    {values.versions_location_enabled && " in container:"}
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                {values.versions_location_enabled && (
                  <Form.Input
                    elementType="select"
                    className="select required form-control"
                    name="versions_location"
                  >
                    <option></option>
                    {otherContainers.map((c, i) => (
                      <option key={i} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Input>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="form-group">
        <label>Metadata</label>
        <CustomMetaTags
          reservedKeys={[
            "web-index",
            "web-listings",
            "quoty-count",
            "quota-bytes",
          ]}
          values={values.customMetadataTags}
          onChange={(newValues) => onChange("customMetadataTags", newValues)}
        />
      </div>
    </>
  )
}

FormBody.propTypes = {
  containerName: PropTypes.string,
  otherContainers: PropTypes.array,
}

const ContainerProperties = () => {
  const { name } = useParams()
  const history = useHistory()
  const [show, setShow] = React.useState(!!name)
  const [error, setError] = React.useState()
  const { containers, capabilities } = useGlobalState()

  const [metadata, setMetadata] = React.useState()
  const [isFetchingMetadata, setIsFetchingMetadata] = React.useState(false)
  const { loadContainerMetadata, updateContainerMetadata } = useActions()

  const customMetadataTags = React.useMemo(() => {
    if (!metadata) return []
    const result = []
    const reserved = [
      "x-container-meta-web-index",
      "x-container-meta-web-listings",
      "x-container-meta-quota-count",
      "x-container-meta-quota-bytes",
    ]
    Object.keys(metadata).forEach((k) => {
      if (k.startsWith("x-container-meta-") && reserved.indexOf(k) < 0)
        result.push({
          key: k.replace("x-container-meta-", ""),
          value: metadata[k],
        })
    })
    return result
  }, [metadata])

  React.useEffect(() => {
    setIsFetchingMetadata(true)
    loadContainerMetadata(name)
      .then((headers) => {
        // console.log("============================metadata", headers)
        setMetadata(headers)
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => setIsFetchingMetadata(false))

    return () => setMetadata(null)
  }, [name])

  const otherContainers = React.useMemo(() => {
    if (containers.isFetching) return
    return containers.items.filter((i) => i.name !== name)
  }, [containers, name])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/containers")
  }, [])

  const submit = React.useCallback(
    (values) => {
      if (!metadata) return Promise.reject("Could not find container")

      let newValues = {
        "x-versions-location":
          (values.versions_location_enabled && values.versions_location) || "",
        "x-container-meta-web-index":
          values.meta_web_index_enabled && values.meta_web_index,
        "x-container-meta-web-listings": values.meta_web_listings ? "1" : "",
        "x-container-meta-quota-count": values.meta_quota_count,
        "x-container-meta-quota-bytes": values.meta_quota_bytes,
      }
      const reservedKeys = Object.keys(newValues)
      values.customMetadataTags.forEach((t) => {
        const key = `x-container-meta-${t.key}`
        if (reservedKeys.indexOf(key) < 0) newValues[key] = t.value
      })

      for (let key in metadata) {
        if (!key.startsWith("x-container-meta")) continue
        if ((metadata[key] && !newValues[key]) || !newValues[key]) {
          newValues[key.replace("x-container", "x-remove-container")] = "1"
          delete newValues[key]
        }
      }

      Object.keys(newValues).forEach((key) => {
        if (
          newValues[key] === undefined ||
          newValues[key] === "false" ||
          newValues[key] === false
        ) {
          newValues[key] = ""
        }
      })

      return updateContainerMetadata(name, newValues)
        .then(close)
        .catch((error) => {
          setError(error.message)
        })
    },
    [metadata, close, name]
  )

  const initialValues = React.useMemo(() => {
    if (!metadata) return {}
    return {
      public_url: `${serviceEndpoint}/${encodeURIComponent(name)}/`,
      versions_location: metadata["x-versions-location"],
      versions_location_enabled: !!metadata["x-versions-location"],
      cap_staticweb: capabilities.data?.staticweb && true,
      meta_web_index_enabled: !!metadata["x-container-meta-web-index"],
      meta_web_listings: !!metadata["x-container-meta-web-listings"],
      meta_web_index: metadata["x-container-meta-web-index"] || "index.html",
      total_size: unit.format(metadata["x-container-bytes-used"]),
      object_count: metadata["x-container-object-count"],
      meta_quota_count: metadata["x-container-meta-quota-count"],
      meta_quota_bytes: metadata["x-container-meta-quota-bytes"],
      read: metadata["x-container-read"],
      versions_enabled:
        metadata["x-versions-enabled"] === "True" ||
        metadata["x-versions-enabled"] === "true" ||
        metadata["x-versions-enabled"] === "1",
      customMetadataTags,
    }
  }, [metadata, customMetadataTags, capabilities, name])

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
          Container: {name}
        </Modal.Title>
      </Modal.Header>

      {isFetchingMetadata ? (
        <Modal.Body>
          <span className="spinner" /> Loading...
        </Modal.Body>
      ) : (
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
                containerName={name}
                otherContainers={otherContainers}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={close}>Cancel</Button>
            {metadata && <Form.SubmitButton label="Update container" />}
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  )
}

export default ContainerProperties
