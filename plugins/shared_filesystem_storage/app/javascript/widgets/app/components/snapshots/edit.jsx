import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import React from "react"

export default class EditSnapshotForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true }
    this.close = this.close.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/snapshots"), 300)
  }

  onSubmit(values) {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  render() {
    let { snapshot } = this.props
    if (!snapshot)
      return (
        <div>
          <span className="spinner" />
          Loading...
        </div>
      )
    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Edit Snapshot {snapshot && snapshot.name}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={() => true}
          initialValues={snapshot}
          onSubmit={this.onSubmit}
        >
          <Modal.Body>
            {!snapshot ? (
              <div>
                <span className="spinner" />
                Loading...
              </div>
            ) : (
              <div>
                <Form.Errors />

                <Form.ElementHorizontal label="Name" name="name">
                  <Form.Input elementType="input" type="text" name="name" />
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="Description" name="description">
                  <Form.Input
                    elementType="textarea"
                    className="text optional form-control"
                    name="description"
                  />
                </Form.ElementHorizontal>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Save" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
