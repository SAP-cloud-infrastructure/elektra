import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import React from "react"
import { apiStateIsDeleting } from "../utils"

export default class RBACPoliciesEditModal extends React.Component {
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

  onSubmit = ({ rule_for_manifest: requiredLabelsStr }) => {
    const newAccount = {
      ...this.props.account,
      validation: {
        rule_for_manifest: requiredLabelsStr,
      },
    }
    return this.props.putAccount(newAccount).then(() => this.close())
  }

  render() {
    const { account, isAdmin } = this.props
    if (!account || apiStateIsDeleting(account?.state)) {
      return null
    }

    const initialValues = {
      rule_for_manifest: (account.validation || {}).rule_for_manifest || "",
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
            Validation rules for account: {this.props.account.name}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          <Modal.Body>
            <Form.ElementHorizontal label="Validation rules" name="required_labels">
              <Form.Input elementType="input" type="text" name="rule_for_manifest" readOnly={!isAdmin} />
              <p className="form-control-static tw-mt-2">
                Validation rules for manifests allow you to restrict image pushes to the account in various ways, e.g. by permitting specific labels through{" "}
                <a
                  href="https://docs.docker.com/engine/reference/builder/#label"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LABEL commands
                </a>{" "}
                in the Dockerfile, or by other means.
              </p>
              <div>
                <div>The rules are configured by using the Common Expression Language (CEL).</div>
                <div>Examples of valid expressions include:</div>
                <pre>
                  <code>
                    <div>&apos;label_1&apos; in labels </div>
                    <div>&apos;label_1&apos; in labels && repo_name == &quot;repository_1&quot;</div>
                    <div>&apos;label_1&apos; in labels || repo_name == &quot;repository_1&quot;</div>
                  </code>
                </pre>
                <div>
                  {" "}
                  More information is available in the{" "}
                  <a
                    href="https://github.com/sapcc/keppel/blob/master/docs/api-spec.md#put-keppelv1accountsname"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Keppel documentation
                  </a>
                </div>
              </div>
            </Form.ElementHorizontal>
          </Modal.Body>

          {isAdmin ? (
            <Modal.Footer>
              <Form.SubmitButton label="Save" />
              <Button onClick={this.close}>Cancel</Button>
            </Modal.Footer>
          ) : (
            <Modal.Footer>
              <Button onClick={this.close}>Close</Button>
            </Modal.Footer>
          )}
        </Form>
      </Modal>
    )
  }
}
