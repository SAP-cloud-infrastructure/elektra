import React from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"

const defaultVolumeType = "vmware"

const FormBody = ({ values, availabilityZones, images, volumes }) => {
  const groupedImages = React.useMemo(() => {
    const result = {}
    if (!images.items) return result
    for (let image of images.items) {
      const visibility = image.visibility || "others"
      result[visibility] = result[visibility] || []
      result[visibility].push(image)
    }
    return result
  }, [images.items])

  return (
    <Modal.Body>
      <Form.Errors />
      <Form.ElementHorizontal label="Name" name="name" required>
        <Form.Input elementType="input" type="text" name="name" />
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="Description" name="description" required>
        <Form.Input elementType="textarea" className="text optional form-control" name="description" />
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="Size in GB" name="size" required>
        <Form.Input elementType="input" type="number" name="size" />
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="" name="bootable">
        <label>
          <Form.Input elementType="input" type="checkbox" name="bootable" /> bootable
        </label>
      </Form.ElementHorizontal>

      {values.bootable && (
        <Form.ElementHorizontal label="Image ID" name="imageRef">
          {images.isFetching ? (
            <span className="spinner" />
          ) : images.error ? (
            <span className="text-danger">Could not load images</span>
          ) : (
            <Form.Input elementType="select" className="select required form-control" name="imageRef">
              <option></option>
              {Object.keys(groupedImages)
                .sort()
                .map((group, i) => (
                  <optgroup key={i} label={group}>
                    {groupedImages[group].sort().map((image, j) => (
                      <option value={image.id} key={j}>
                        {image.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </Form.Input>
          )}
          <span className="help-block">
            The UUID of the image from which you want to create the volume. Required to create a bootable volume.
          </span>
        </Form.ElementHorizontal>
      )}

      <Form.ElementHorizontal label="Volume Type" name="volume_type" required>
        {volumes.typesIsFetching ? (
          <span className="spinner" />
        ) : volumes.error ? (
          <span className="text-danger">{volumes.error}</span>
        ) : (
          <Form.Input elementType="select" className="select required form-control" name="volume_type">
            {volumes.types.map((vt, index) => {
              let name = vt.description
              if (vt.description === null) {
                name = vt.name
              }
              return (
                <option value={vt.name} key={index}>
                  {" "}
                  {name}{" "}
                </option>
              )
            })}
          </Form.Input>
        )}
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="Availability Zone" required name="availability_zone">
        {availabilityZones.isFetching ? (
          <span className="spinner" />
        ) : availabilityZones.error ? (
          <span className="text-danger">{availabilityZones.error}</span>
        ) : (
          <Form.Input elementType="select" className="select required form-control" name="availability_zone">
            <option></option>
            {availabilityZones.items.map((az, index) => (
              <option value={az.zoneName} key={index}>
                {az.zoneName}
              </option>
            ))}
          </Form.Input>
        )}
      </Form.ElementHorizontal>
    </Modal.Body>
  )
}

const NewVolumeForm = ({
  volumes,
  images,
  availabilityZones,
  loadAvailabilityZonesOnce,
  loadImagesOnce,
  loadVolumeTypesOnce,
  handleSubmit,
  history,
}) => {
  const [show, setShow] = React.useState(true)

  React.useEffect(() => {
    loadAvailabilityZonesOnce()
    loadImagesOnce()
    loadVolumeTypesOnce()
  }, [])

  const validate = React.useCallback(
    ({ name, size, volume_type, availability_zone, description, bootable, imageRef }) => {
      // Pure validation function - no side effects
      return name && size && volume_type && availability_zone && description && (!bootable || imageRef) && true
    },
    []
  )

  const close = React.useCallback(
    (e) => {
      if (e) e.stopPropagation()
      setShow(false)
    },
    [setShow]
  )

  const restoreUrl = React.useCallback(
    (e) => {
      if (!show) history.replace(`/volumes`)
    },
    [show, history]
  )

  const onSubmit = React.useCallback(
    (values) => {
      return handleSubmit(values).then(() => close())
    },
    [handleSubmit, close]
  )

  const initialValues = React.useMemo(() => ({ volume_type: defaultVolumeType }), [])

  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      backdrop="static"
      onExited={restoreUrl}
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Volume</Modal.Title>
      </Modal.Header>

      <Form className="form form-horizontal" validate={validate} onSubmit={onSubmit} initialValues={initialValues}>
        <FormBody availabilityZones={availabilityZones} images={images} volumes={volumes} />

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewVolumeForm
