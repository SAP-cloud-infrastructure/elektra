import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import * as constants from "../../constants"

const FormBody = ({ values }) => (
  <Modal.Body>
    <Form.Errors />

    <Form.ElementHorizontal label="Status" name="status" required>
      <Form.Input
        elementType="select"
        className="select required form-control"
        name="status"
      >
        <option></option>
        {constants.SNAPSHOT_RESET_STATUS.map((state, index) => (
          <option value={state} key={index}>
            {state}
          </option>
        ))}
      </Form.Input>
    </Form.ElementHorizontal>
  </Modal.Body>
)

export default class ResetSnapshotStatusForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    if (!this.props.snapshot) {
      this.props
        .loadSnapshot()
        .catch((loadError) => this.setState({ loadError }))
    }
  }

  validate = (values) => {
    return values.status && true
  }

  close = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  restoreUrl = (e) => {
    if (!this.state.show) this.props.history.replace(`/snapshots`)
  }

  onSubmit = (values) => {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  render() {
    const { snapshot } = this.props
    const initialValues = snapshot
      ? {
          status: snapshot.status,
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
          <Modal.Title id="contained-modal-title-lg">
            Reset Snapshot Status{" "}
            <span className="info-text">
              {(snapshot && snapshot.name) || this.props.id}
            </span>
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          {this.props.snapshot ? (
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
