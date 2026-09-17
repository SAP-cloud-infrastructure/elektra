import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import * as constants from "../../constants"

const FormBody = ({ values, volume, availabilityZones }) => (
  <Modal.Body>
    <Form.Errors />

    <Form.ElementHorizontal label="Source Volume" name="source_volid">
      <p className="form-control-static">
        {volume ? (
          <>
            {volume.name}
            <br />
            <span className="info-text">ID: {volume.id}</span>
          </>
        ) : (
          volume.id
        )}
      </p>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Image Name" name="image_name" required>
      <Form.Input elementType="input" type="text" name="image_name" />
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Disk Format" name="disk_format">
      <Form.Input
        elementType="select"
        className="select  form-control"
        name="disk_format"
      >
        <option></option>
        <option>raw</option>
        <option>vmdk</option>
      </Form.Input>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Container Format" name="container_format">
      <Form.Input
        elementType="select"
        className="select  form-control"
        name="container_format"
      >
        <option></option>
        <option>bare</option>
      </Form.Input>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Visibility" name="visibility">
      <Form.Input
        elementType="select"
        className="select  form-control"
        name="visibility"
      >
        <option></option>
        <option>private</option>
        <option>shared</option>
        <option>community</option>
        <option>public</option>
      </Form.Input>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="" name="protected">
      <label>
        <Form.Input elementType="input" type="checkbox" name="protected" />
        Protect this image
      </label>
    </Form.ElementHorizontal>

    {/* Removing checkbox because force option doesn't work at the moment. */}
    {/* <Form.ElementHorizontal label="" name="force">
      <label>
        <Form.Input elementType="input" type="checkbox" name="force" />
        Upload even if it is attached to an instance.
      </label>
    </Form.ElementHorizontal> */}
  </Modal.Body>
)

export default class ToImageForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    if (!this.props.volume) {
      this.props.loadVolume().catch((loadError) => this.setState({ loadError }))
    }
  }

  validate = (values) => {
    return values.image_name && true
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
    const { volume, id } = this.props
    const initialValues = volume
      ? {
          image_name: `from-volume-${volume.name}`,
          force: false,
          disk_format: "vmdk",
          container_format: "bare",
          visibility: "private",
          protected: true,
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
            Upload To Image{" "}
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
            <Form.SubmitButton label="Clone" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
