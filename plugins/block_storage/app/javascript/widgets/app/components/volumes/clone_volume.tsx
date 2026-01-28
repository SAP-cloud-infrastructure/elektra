import React, { useState, useEffect, useCallback } from "react"
// @ts-expect-error - react-bootstrap has no types
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - elektra-form has no types
import { Form } from "lib/elektra-form"

interface AvailabilityZone {
  zoneName: string
}

interface AvailabilityZones {
  isFetching: boolean
  error: string | null
  items: AvailabilityZone[]
}

interface Volume {
  id: string
  name: string
  description?: string
  size: number
  availability_zone: string
}

interface CloneVolumeFormValues {
  source_volid?: string
  name?: string
  description?: string
  availability_zone?: string
  size?: number
}

interface FormBodyProps {
  values?: CloneVolumeFormValues
  volume: Volume
  availabilityZones: AvailabilityZones
}

const FormBody: React.FC<FormBodyProps> = ({ values, volume, availabilityZones }) => (
  <Modal.Body>
    <Form.Errors />

    <Form.ElementHorizontal label="Source Volume" name="source_volid">
      <p className="form-control-static">
        {volume.name}
        <br />
        <span className="info-text">ID: {volume.id}</span>
      </p>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Name" name="name" required>
      <Form.Input elementType="input" type="text" name="name" />
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Description" name="description" required>
      <Form.Input elementType="textarea" className="text optional form-control" name="description" />
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Size in GB" name="size" required>
      <Form.Input elementType="input" type="number" name="size" min={1} step={1} />
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Availability Zone" required name="availability_zone">
      {availabilityZones.isFetching ? (
        <span className="spinner" />
      ) : availabilityZones.error ? (
        <span className="text-danger">{availabilityZones.error}</span>
      ) : (
        <Form.Input elementType="select" className="select required form-control" name="availability_zone">
          <option></option>
          {availabilityZones.items.map((az) => (
            <option value={az.zoneName} key={az.zoneName}>
              {az.zoneName}
            </option>
          ))}
        </Form.Input>
      )}
    </Form.ElementHorizontal>
  </Modal.Body>
)

interface CloneVolumeFormProps {
  id: string
  volume: Volume | null
  availabilityZones: AvailabilityZones
  history: {
    replace: (path: string) => void
  }
  loadVolume: () => Promise<any>
  loadAvailabilityZonesOnce: () => void
  handleSubmit: (values: CloneVolumeFormValues) => Promise<any>
}

const CloneVolumeForm: React.FC<CloneVolumeFormProps> = ({
  id,
  volume,
  availabilityZones,
  history,
  loadVolume,
  loadAvailabilityZonesOnce,
  handleSubmit,
}) => {
  const [show, setShow] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load dependencies and volume on mount and when dependencies change
  useEffect(() => {
    if (!volume) {
      loadVolume().catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        setLoadError(message)
      })
    }
    loadAvailabilityZonesOnce()
  }, [volume, loadVolume, loadAvailabilityZonesOnce])

  const validate = useCallback((values: CloneVolumeFormValues) => {
    const hasName = Boolean(values.name && values.name.trim().length > 0)
    const hasDesc = Boolean(values.description && values.description.trim().length > 0)
    const hasSize = typeof values.size === "number" && values.size > 0
    const hasAZ = Boolean(values.availability_zone)
    const hasSource = Boolean(values.source_volid)
    return hasName && hasDesc && hasSize && hasAZ && hasSource
  }, [])

  const close = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }, [])

  const restoreUrl = useCallback(() => {
    if (!show) {
      history.replace(`/volumes`)
    }
  }, [show, history])

  const onSubmit = useCallback(
    (values: CloneVolumeFormValues) => {
      return handleSubmit(values).then(() => close())
    },
    [handleSubmit, close]
  )

  const initialValues: CloneVolumeFormValues = volume
    ? {
        source_volid: volume.id,
        name: `clone-${volume.name}`,
        description: `Clone of the volume ${volume.name} (${volume.id})`,
        availability_zone: volume.availability_zone,
        size: volume.size,
      }
    : {}

  return (
    <Modal show={show} onHide={close} size="lg" onExited={restoreUrl} aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          Clone Volume <span className="info-text">{(volume && volume.name) || id}</span>
        </Modal.Title>
      </Modal.Header>

      <Form className="form form-horizontal" validate={validate} onSubmit={onSubmit} initialValues={initialValues}>
        {loadError ? (
          <Modal.Body>
            <div className="text-danger">
              <h4>Could not load volume!</h4>
              <p>{loadError}</p>
            </div>
          </Modal.Body>
        ) : volume ? (
          <FormBody volume={volume} availabilityZones={availabilityZones} />
        ) : (
          <Modal.Body>
            <span className="spinner"></span>
            Loading...
          </Modal.Body>
        )}

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Clone" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CloneVolumeForm
