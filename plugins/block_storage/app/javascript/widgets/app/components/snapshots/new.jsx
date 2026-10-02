import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"

const FormBody = ({ values, volume }) => (
  <Modal.Body>
    <Form.Errors />

    <Form.ElementHorizontal label="Source Volume" name="volume_id" required>
      <p className="form-control-static">
        {volume ? (
          <>
            {volume.name}
            <br />
            <span className="info-text">{volume.id}</span>
          </>
        ) : (
          values.volume_id
        )}
      </p>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Name" name="name" required>
      <Form.Input elementType="input" type="text" name="name" />
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Description" name="description">
      <Form.Input
        elementType="textarea"
        className="text optional form-control"
        name="description"
      />
    </Form.ElementHorizontal>
  </Modal.Body>
)

export default class NewPortForm extends React.Component {
  state = { show: true }

  validate = (values) => {
    // console.log(values)
    return values.volume_id && values.name && true
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
    const initialValues = this.props.volume
      ? {
          volume_id: this.props.volume_id,
          name: `snap-${this.props.volume.name}`,
          description: `Snapshot of the volume ${this.props.volume.name}`,
        }
      : {}

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        backdrop="static"
        onExited={this.restoreUrl}
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">New Snapshot</Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          <FormBody volume={this.props.volume} />

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Save" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
