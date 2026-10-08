import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { PLATFORM_FILTER_OPTIONS } from "../../constants"
import { PlatformFilterSelect, getPlatformFilterKeyForForm } from "../componentHelpers/PlatformFilterSelect"
import React from "react"

const FormBody = ({ values }) => {
  return (
    <Modal.Body>
      <PlatformFilterSelect value={values.platform_filter} />
    </Modal.Body>
  )
}

export default class PlatformFilterConfigModal extends React.Component {
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

  onSubmit = ({ platform_filter }) => {
    const filterConfig = PLATFORM_FILTER_OPTIONS[platform_filter]
    const newAccount = {
      ...this.props.account,
      platform_filter: filterConfig?.value || null,
    }
    return this.props.putAccount(newAccount).then(() => this.close())
  }

  render() {
    const { account, isAdmin } = this.props
    if (!account || !account.replication || account.replication.strategy != "from_external_on_first_use" || !isAdmin) {
      return null
    }

    const initialValues = {
      platform_filter: getPlatformFilterKeyForForm(account.platform_filter),
    }

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
            Edit platform filter settings for Keppel account: {account.name}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          <FormBody />

          <Modal.Footer>
            <Form.SubmitButton label="Save" />
            <Button onClick={this.close}>Cancel</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
