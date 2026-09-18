import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import * as constants from "../../constants"

const FormBody = ({ values }) => (
  <Modal.Body>
    <Form.Errors />

    <div className="alert alert-warning">
      Explicitly updates the volume state in the Cinder database. Note that this
      does not affect whether the volume is actually attached to the Nova
      compute host or instance and can result in an unusable volume. Being a
      database change only, this has no impact on the true state of the volume
      and may not match the actual state. This can render a volume unusable in
      the case of change to the available state.
    </div>

    <Form.ElementHorizontal label="Status" name="status" required>
      <Form.Input
        elementType="select"
        className="select required form-control"
        name="status"
      >
        <option></option>
        {constants.VOLUME_RESET_STATUS.map((state, index) => (
          <option value={state} key={index}>
            {state}
          </option>
        ))}
      </Form.Input>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Attach Status" name="attach_status" required>
      <Form.Input
        elementType="select"
        className="select required form-control"
        name="attach_status"
      >
        <option></option>
        {constants.VOLUME_RESET_ATTACH_STATUS.map((state, index) => (
          <option value={state} key={index}>
            {state}
          </option>
        ))}
      </Form.Input>
    </Form.ElementHorizontal>
  </Modal.Body>
)

export default class ResetVolumeStatusForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    if (!this.props.volume) {
      this.props.loadVolume().catch((loadError) => this.setState({ loadError }))
    }
  }

  validate = (values) => {
    return values.status && values.attach_status && true
  }

  close = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  restoreUrl = (e) => {
    if (!this.state.show) this.props.history.replace(`/volumes`)
  }

  onSubmit = (values) => {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  render() {
    const { volume } = this.props
    const initialValues = volume
      ? {
          status: volume.status,
          attach_status:
            volume.attachments && volume.attachments.length > 0
              ? constants.VOLUME_STATE_ATTACHED
              : constants.VOLUME_STATE_DETACHED,
        }
      : {}

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        onExited={this.restoreUrl}
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Reset Volume Status{" "}
            <span className="info-text">
              {(volume && volume.name) || this.props.id}
            </span>
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          {this.props.volume ? (
            <FormBody />
          ) : (
            <Modal.Body>
              <span className="spinner"></span>
              Loading...
            </Modal.Body>
          )}

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Save" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
