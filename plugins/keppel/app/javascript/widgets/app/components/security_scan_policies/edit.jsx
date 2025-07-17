import React from "react"
import { Modal, Button } from "react-bootstrap"
import { FormErrors } from "lib/elektra-form/components/form_errors"
import { v4 as uuidv4 } from "uuid"
import { validatePolicy } from "./utils"
import { apiStateIsDeleting } from "../utils"
import { moveItems } from "../modalHelpers/moveOperation"
import SecurityScanPoliciesEditRow from "./row"

export default class SecurityScanPoliciesEditModal extends React.Component {
  state = {
    show: true,
    policies: null,
    isSubmitting: false,
    apiErrors: null,
  }

  componentDidMount() {
    this.loadData()
  }
  componentDidUpdate() {
    if (!this.props.policies.isFetching) {
      this.initState()
    }
  }
  initState() {
    if (!this.props.account) {
      this.close()
      return
    }
    if (this.state.policies == null) {
      const policies = this.props?.policies?.data || []
      for (const policy of policies) {
        policy.ui_hints = {}
        policy.ui_hints.repo_filter =
          policy.match_repository !== ".*" || (policy.except_repository || "") !== "" ? "on" : "off"
        policy.ui_hints.vulnID_filter =
          policy.match_vulnerability_id !== ".*" || (policy.except_vulnerability_id || "") !== "" ? "on" : "off"
        policy.ui_hints.severity = policy.action?.ignore ? "Ignore" : policy.action.severity
        policy.ui_hints.key = uuidv4()
      }
      this.setState({ ...this.state, policies })
    }
  }
  loadData = () => {
    this.props.loadPoliciesOnce()
  }

  close = (e) => {
    if (e) {
      e.stopPropagation()
    }
    this.setState({ ...this.state, show: false })
    setTimeout(() => this.props.history.replace("/accounts"), 300)
  }

  addPolicy = () => {
    const newPolicy = {
      match_repository: ".*",
      match_vulnerability_id: ".*",
      action: {
        ignore: false,
        severity: "",
        assessment: "",
      },
      ui_hints: {
        key: uuidv4(),
        repo_filter: "off",
        vulnID_filter: "off",
      },
    }
    this.setState({
      ...this.state,
      policies: [...this.state.policies, newPolicy],
    })
  }
  removePolicy = (idx, input) => {
    const policies = this.state.policies.filter((p, index) => idx != index)
    this.setState({ ...this.state, policies })
  }
  movePolicy = ({ index: idx, step: step }) => {
    const policies = moveItems(this.state.policies, { index: idx, step: step })
    this.setState({ ...this.state, policies })
  }

  setPolicyAttribute = (idx, attr, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx] }
    switch (attr) {
      case "match_repository":
      case "except_repository":
      case "match_vulnerability_id":
      case "except_vulnerability_id":
        policies[idx][attr] = input
        break
      case "severity":
        policies[idx].ui_hints.severity = input
        policies[idx].action.severity = input
        break
      case "assessment":
        policies[idx].action.assessment = input
        break
      case "repo_filter":
        policies[idx].ui_hints.repo_filter = input
        policies[idx].match_repository = ".*"
        delete policies[idx].except_repository
        break
      case "vulnID_filter":
        policies[idx].ui_hints.vulnID_filter = input
        policies[idx].match_vulnerability_id = ".*"
        delete policies[idx].except_vulnerability_id
        break
    }
    this.setState({ ...this.state, policies })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    if (this.state.isSubmitting) {
      return
    }

    this.setState({
      ...this.state,
      isSubmitting: true,
      apiErrors: null,
    })
    const newPolicies = []
    for (const policy of this.state.policies) {
      const policyCloned = { ...policy }
      if (policy.ui_hints.severity == "Ignore") {
        policy.action.ignore = true
        policy.action.severity = ""
      } else {
        policy.action.ignore = false
      }
      delete policyCloned.ui_hints
      newPolicies.push(policyCloned)
    }

    this.props
      .putPolicies(newPolicies)
      .then(() => this.close())
      .catch((errors) => {
        this.setState({
          ...this.state,
          isSubmitting: false,
          apiErrors: errors,
        })
      })
  }

  render() {
    const { account, isAdmin } = this.props
    if (!account || apiStateIsDeleting(account?.state)) {
      return
    }

    const { isFetching: isFetchingPolicies } = this.props.policies
    const policies = this.state.policies || []
    const isValid = policies.every((p) => validatePolicy(p) === null)
    const { isSubmitting } = this.state

    const { movePolicy, setPolicyAttribute, removePolicy } = this
    const commonPropsForRow = {
      isEditable: isAdmin,
      policyCount: policies.length,
      movePolicy,
      setPolicyAttribute,
      removePolicy,
    }

    //NOTE: className='keppel' on Modal ensures that plugin-specific CSS rules get applied
    return (
      <Modal
        className="keppel"
        dialogClassName="modal-xl"
        backdrop="static"
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">Security Scan Policies for account: {account.name}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {this.state.apiErrors && <FormErrors errors={this.state.apiErrors} />}
          <p className="bs-callout bs-callout-info bs-callout-emphasize">
            <strong>The order of policies is significant!</strong> Policies are evaluated starting from the top of the
            list. For each image, the first policy that matches gets applied, and all subsequent policies will be
            ignored.
          </p>

          <table className="table">
            <thead>
              <tr>
                <th className="col-md-1">{isAdmin ? "Order" : ""}</th>
                <th className="col-md-2">Update severity</th>
                <th className="col-md-8">Matching rules</th>
                <th className="col-md-1">
                  {isAdmin && (
                    <button className="btn btn-sm btn-default" onClick={this.addPolicy}>
                      Add policy
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy, idx) => (
                <SecurityScanPoliciesEditRow
                  {...commonPropsForRow}
                  key={policy.ui_hints.key}
                  index={idx}
                  policy={policy}
                />
              ))}
              {policies.length == 0 && (
                <tr>
                  <td colSpan="4" className="text-muted text-center">
                    {isFetchingPolicies ? (
                      <div>
                        <span className="spinner" /> Loading security scan policy list...
                      </div>
                    ) : (
                      "No entries"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {policies.length > 0 && (
            <p>
              Matches on repository names and vulnerability IDs use the{" "}
              <a href="https://golang.org/pkg/regexp/syntax/">Go regex syntax</a>. Leading <code>^</code> and trailing{" "}
              <code>$</code> anchors are always added automatically.
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          {isAdmin ? (
            <>
              <Button
                onClick={this.handleSubmit}
                bsStyle="primary"
                disabled={!isValid || isSubmitting || isFetchingPolicies}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button onClick={this.close}>Cancel</Button>
            </>
          ) : (
            <Button onClick={this.close}>Close</Button>
          )}
        </Modal.Footer>
      </Modal>
    )
  }
}
