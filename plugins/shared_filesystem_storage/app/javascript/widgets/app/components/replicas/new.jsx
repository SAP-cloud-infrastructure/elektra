import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import React from "react"

export default class NewReplicaForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true }
    this.close = this.close.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    this.setState({ show: false })
    setTimeout(
      () => this.props.history.replace(`/${this.props.match.params.parent}`),
      300
    )
  }

  onSubmit(values) {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  render() {
    let { share } = this.props
    return (
      <Modal
        backdrop="static"
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            New Replica for Share {share && (share.name || share.id)}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={() => true}
          onSubmit={this.onSubmit}
        >
          <Modal.Body>
            <Form.Errors />

            <Form.ElementHorizontal label="Availability Zone" name="share_az">
              {this.props.availabilityZones.isFetching ? (
                <span>
                  <span className="spinner"></span>Loading...
                </span>
              ) : (
                <div>
                  <Form.Input
                    elementType="select"
                    name="availability_zone"
                    className="required select form-control"
                  >
                    <option></option>
                    {this.props.availabilityZones.items.map((az, index) => (
                      <option value={az.name} key={index}>
                        {az.name}
                      </option>
                    ))}
                  </Form.Input>

                  {this.props.availabilityZones.items.length == 0 && (
                    <p className="help-block">
                      <i className="fa fa-info-circle"></i>
                      No availability zones available.
                    </p>
                  )}
                </div>
              )}
            </Form.ElementHorizontal>
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
