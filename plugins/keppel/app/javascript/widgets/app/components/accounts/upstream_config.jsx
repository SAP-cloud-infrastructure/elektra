import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import React from "react"

export default class AccountUpstreamConfigModal extends React.Component {
  state = {
    show: true,
  }

  close = (e) => {
    if (e) {
      e.stopPropagation()
    }
    this.setState({ ...this.state, show: false })
    setTimeout(() => this.props.history.replace("/accounts"), 300)
  }

  validate = (values) => {
    return true
  }

  onSubmit = ({ username, password }) => {
    const invalid = (field, reason) =>
      Promise.reject({ errors: { [field]: reason } })
    if (username != "" && password == "") {
      return invalid("password", "must be given if username is given")
    }
    if (username == "" && password != "") {
      return invalid("username", "must be given if password is given")
    }

    const newAccount = {
      ...this.props.account,
      replication: {
        ...this.props.account.replication,
        upstream: {
          ...this.props.account.replication.upstream,
          username,
          password,
        },
      },
    }
    return this.props.putAccount(newAccount).then(() => this.close())
  }

  render() {
    const { account, isAdmin } = this.props
    if (
      !account ||
      !account.replication ||
      account.replication.strategy != "from_external_on_first_use" ||
      !isAdmin
    ) {
      return null
    }

    const { url, username, password } = account.replication.upstream
    const initialValues = { url, username, password }

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
            Edit replication credentials for Keppel account: {account.name}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          <Modal.Body>
            <Form.ElementHorizontal label="Upstream source" name="url">
              <Form.Input
                elementType="input"
                type="text"
                name="url"
                readOnly={true}
              />
            </Form.ElementHorizontal>

            <Form.ElementHorizontal label="Username" name="username">
              <Form.Input elementType="input" type="text" name="username" />
            </Form.ElementHorizontal>
            <Form.ElementHorizontal label="Password" name="password">
              <Form.Input elementType="input" type="password" name="password" />
            </Form.ElementHorizontal>
          </Modal.Body>

          <Modal.Footer>
            <Form.SubmitButton label="Save" />
            <Button onClick={this.close}>Cancel</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
