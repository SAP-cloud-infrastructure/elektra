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

    function getDocumentationLink(url, label) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      )
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
            <Form.ElementHorizontal label="Rule" labelWidth={1} name="rule_for_manifest">
              <Form.Input elementType="input" type="text" name="rule_for_manifest" readOnly={!isAdmin} />
              <div className="form-control-static tw-mt-2">
                Setting a validation rule for manifests will restrict image pushes to only allow images that match the
                provided rule. Validation rules for Keppel are written in{" "}
                {getDocumentationLink("https://cel.dev/", "Common Expression Language (CEL)")}.<h4>Examples</h4>
                <div className="tw-mb-1">
                  Manifest validation rules can access <code>labels</code> in the manifest that were set using e.g. in
                  the image&apos;s Dockerfile. The example rule below will only allow images that link to their source
                  code using the respective{" "}
                  {getDocumentationLink(
                    "https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys",
                    "well known label"
                  )}
                  :
                </div>
                <pre>
                  <code>&quot;org.opencontainers.image.source&quot; in labels</code>
                </pre>
                <div className="tw-mb-1">
                  Manifest validation rules can access the <code>repo_name</code> where the manifest is being pushed to.
                  The example rule below requires that manifests pushed to a repo starting with <code>official/</code>{" "}
                  refer to a source repository below a certain GitHub organization:
                </div>
                <pre>
                  <code>
                    repo_name.startsWith(&quot;official/&quot;)
                    <br />
                    ?
                    labels[&quot;org.opencontainers.image.source&quot;].startsWith(&quot;https://github.com/example-official/&quot;)
                    <br />: true
                  </code>
                </pre>
                <div>
                  The{" "}
                  {getDocumentationLink(
                    "https://github.com/sapcc/keppel/blob/master/docs/api-spec.md#put-keppelv1accountsname",
                    "API reference in the Keppel documentation"
                  )}{" "}
                  contains the complete and most up-to-date list of attributes that are available inside the validation
                  rule expression.
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
