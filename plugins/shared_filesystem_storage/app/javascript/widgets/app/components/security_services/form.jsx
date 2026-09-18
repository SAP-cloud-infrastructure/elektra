/* eslint-disable react/no-unescaped-entities */
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import React from "react"

export default class SecurityServiceForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true }
    this.close = this.close.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.renderForm = this.renderForm.bind(this)
  }

  validate(values) {
    return values.type && values.name && values.ou && true
  }

  close(e) {
    if (e) e.stopPropagation()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/security-services"), 300)
  }

  onSubmit(values) {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  renderForm({ values }) {
    return (
      <>
        <Modal.Body>
          <Form.Errors />

          <Form.ElementHorizontal label="Type" name="type" required>
            <Form.Input elementType="select" type="text">
              <option></option>
              <option value="active_directory">Active Directory</option>
              <option value="ldap">LDAP</option>
            </Form.Input>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal
            label="OU (Organizational Unit)"
            name="ou"
            required
          >
            <Form.Input elementType="input" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Name" name="name">
            <Form.Input elementType="input" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input elementType="textarea" className="text" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="DNS IP" name="dns_ip">
            <Form.Input elementType="input" />
            <p className="help-block">
              <i className="fa fa-info-circle" />
              You can provide an IP (ipv4) of your AD's DNS. It is possible to
              specify multiple addresses separated by commas.
            </p>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="User" name="user">
            <Form.Input elementType="input" />
          </Form.ElementHorizontal>

          {values.user && values.user.trim().length > 0 && (
            <Form.ElementHorizontal label="Password" name="password">
              <Form.Input elementType="input" />
            </Form.ElementHorizontal>
          )}

          <Form.ElementHorizontal label="Domain" name="domain">
            <Form.Input elementType="input" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Server" name="server">
            <Form.Input elementType="input" />
            <p className="help-block">
              <i className="fa fa-info-circle" />
              You can provide an IP (ipv4) of your AD's preferred DC. It is
              possible to specify multiple addresses separated by commas.
            </p>
          </Form.ElementHorizontal>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </>
    )
  }

  render() {
    const FormContent = this.renderForm
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
            {this.props.title}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={this.props.securityService || {}}
        >
          <FormContent />
        </Form>
      </Modal>
    )
  }
}
