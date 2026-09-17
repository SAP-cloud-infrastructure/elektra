import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import * as constants from "../../constants"

const FormBody = ({ values, volume }) => (
  <Modal.Body>
    <Form.Errors />

    <p className="alert alert-notice">
      New size for extend must be greater than current size.
      <br />
      {volume && `Current Size is ${volume.size} GB`}
    </p>

    <Form.ElementHorizontal label="New size in GB" name="size" required>
      <Form.Input elementType="input" type="number" name="size" />
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
    return (
      values.size && this.props.volume && values.size > this.props.volume.size
    )
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
          size: volume.size,
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
            Extend Volume Size{" "}
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
            <FormBody volume={volume} />
          ) : (
            <Modal.Body>
              <span className="spinner"></span>
              Loading...
            </Modal.Body>
          )}

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Extend" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
