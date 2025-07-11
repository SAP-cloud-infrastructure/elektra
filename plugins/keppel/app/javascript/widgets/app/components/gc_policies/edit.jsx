/* eslint-disable react/no-unescaped-entities */
import { Modal, Button } from "react-bootstrap"
import { v4 as uuidv4 } from "uuid"
import { FormErrors } from "lib/elektra-form/components/form_errors"
import React from "react"

import GCPoliciesEditRow from "./row"
import { validatePolicy } from "./utils"
import { apiStateIsDeleting } from "../utils"
import { moveItems } from "../moveOperation"

export default class GCPoliciesEditModal extends React.Component {
  state = {
    show: true,
    policies: null,
    isSubmitting: false,
    apiErrors: null,
  }

  componentDidMount() {
    this.initState()
  }
  componentDidUpdate() {
    this.initState()
  }
  initState() {
    if (!this.props.account) {
      this.close()
      return
    }
    if (this.state.policies == null) {
      const policies = [...(this.props.account.gc_policies || [])]
      for (const policy of policies) {
        //We cannot derive the full state of the UI out of the policy itself.
        //When adding new matches, the new match will initially be unfilled,
        //which the UI would otherwise misinterpret as the absence of the
        //filter, causing the edit UI for the filter to remain hidden.
        policy.ui_hints = {}
        policy.ui_hints.repo_filter =
          policy.match_repository !== ".*" ||
          (policy.except_repository || "") !== ""
            ? "on"
            : "off"
        if (policy.only_untagged) {
          policy.ui_hints.tag_filter = "untagged"
        } else {
          policy.ui_hints.tag_filter =
            (policy.match_tag || "") !== "" || (policy.except_tag || "") !== ""
              ? "on"
              : "off"
        }
        //Also, we give a unique key to each policy that gets used as the "key"
        //property in the list of table rows. This ensures that button focus
        //behaves as expected when moving rows down or up.
        policy.ui_hints.key = uuidv4()
      }
      this.setState({ ...this.state, policies })
    }
  }

  close = (e) => {
    if (e) {
      e.stopPropagation()
    }
    this.setState({ ...this.state, show: false })
    setTimeout(() => this.props.history.replace("/accounts"), 300)
  }

  addPolicy = (e) => {
    const newPolicy = {
      match_repository: ".*",
      action: "protect",
      ui_hints: { key: uuidv4(), repo_filter: "off", tag_filter: "off" },
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
  movePolicy = (idx, step) => {
    const policies = moveItems(this.state.policies, idx, step)
    this.setState({ ...this.state, policies })
  }

  setPolicyAttribute = (idx, attr, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx] }
    switch (attr) {
      case "action":
      case "match_repository":
      case "except_repository":
      case "match_tag":
      case "except_tag":
        policies[idx][attr] = input
        break
      case "repo_filter":
        policies[idx].ui_hints.repo_filter = input
        policies[idx].match_repository = ".*"
        delete policies[idx].except_repository
        break
      case "tag_filter":
        policies[idx].ui_hints.tag_filter = input
        policies[idx].only_untagged = input == "untagged"
        if (input == "on") {
          policies[idx].match_tag = ".*"
        } else {
          delete policies[idx].match_tag
        }
        delete policies[idx].except_tag
        break
      case "timestamp":
        if (input == "off") {
          delete policies[idx].time_constraint
        } else {
          policies[idx].time_constraint = {
            ...(policies[idx].time_constraint || {}),
            on: input,
          }
        }
        break
      case "time_constraint": {
        const defaultValues = {
          oldest: 5,
          newest: 5,
          older_than: { value: 1, unit: "w" },
          newer_than: { value: 1, unit: "w" },
        }
        policies[idx].time_constraint = {
          ...policies[idx].time_constraint,
        }
        for (const key in defaultValues) {
          if (input == key) {
            policies[idx].time_constraint[key] = defaultValues[key]
          } else {
            delete policies[idx].time_constraint[key]
          }
        }
        break
      }
      case "oldest":
      case "newest":
        policies[idx].time_constraint = {
          ...policies[idx].time_constraint,
          [attr]: input || 1,
        }
        break
      case "older_than":
      case "newer_than":
        policies[idx].time_constraint = {
          ...policies[idx].time_constraint,
          [attr]: {
            ...policies[idx].time_constraint[attr],
            value: input || 1,
          },
        }
        break
      case "time_unit": {
        const tc = {
          ...policies[idx].time_constraint,
        }
        if ("older_than" in tc) {
          tc.older_than = { ...tc.older_than, unit: input }
        }
        if ("newer_than" in tc) {
          tc.newer_than = { ...tc.newer_than, unit: input }
        }
        policies[idx].time_constraint = tc
        break
      }
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
    const newAccount = { ...this.props.account, gc_policies: [] }
    for (const policy of this.state.policies) {
      const policyCloned = { ...policy }
      delete policyCloned.ui_hints
      newAccount.gc_policies.push(policyCloned)
    }

    this.props
      .putAccount(newAccount)
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

    const policies = this.state.policies || []
    const isValid = policies.every((p) => validatePolicy(p) === null)
    const { isSubmitting, errorMessage, apiErrors } = this.state

    const { movePolicy, setPolicyAttribute, removePolicy } = this
    const commonPropsForRow = {
      isEditable: isAdmin,
      policyCount: policies.length,
      movePolicy,
      setPolicyAttribute,
      removePolicy,
    }

    const hasLastPullPolicies = policies.some(
      (policy) => ((policy.time_constraint || {}).on || "") == "last_pulled_at",
    )

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
          <Modal.Title id="contained-modal-title-lg">
            Garbage collection policies for account: {account.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {this.state.apiErrors && <FormErrors errors={this.state.apiErrors} />}
          <p>
            If GC policies are maintained, they will be evaluated by Keppel
            about once every hour, and matching images will be deleted
            automatically. Deletions will be recorded in the project's audit log
            with the initiator <code>policy-driven-gc</code>.
          </p>
          <p className="bs-callout bs-callout-info bs-callout-emphasize">
            <strong>The order of policies is significant!</strong> Policies are
            evaluated starting from the top of the list. For each image, the
            first policy that matches gets applied, and all subsequent policies
            will be ignored.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th className="col-md-1">{isAdmin ? "Order" : ""}</th>
                <th className="col-md-2">Action</th>
                <th className="col-md-8">Matching rule</th>
                <th className="col-md-1">
                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-default"
                      onClick={this.addPolicy}
                    >
                      Add policy
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy, idx) => (
                <GCPoliciesEditRow
                  {...commonPropsForRow}
                  key={policy.ui_hints.key}
                  index={idx}
                  policy={policy}
                />
              ))}
              {policies.length == 0 && (
                <tr>
                  <td colSpan="4" className="text-muted text-center">
                    No entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {policies.length > 0 && (
            <p>
              Matches on repository names and tag names use the{" "}
              <a href="https://golang.org/pkg/regexp/syntax/">
                Go regex syntax
              </a>
              . Leading <code>^</code> and trailing <code>$</code> anchors are
              always added automatically.
            </p>
          )}
          {hasLastPullPolicies && (
            <p className="bs-callout bs-callout-warning bs-callout-emphasize">
              Some of these policies evaluate the last pull timestamp of images.
              Please be aware that, for the purposes of GC policy evaluation,
              images that have <strong>never been pulled</strong> will have
              their last pull timestamp set to the UNIX epoch (midnight UTC of
              January 1st, 1970).
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          {isAdmin ? (
            <>
              <Button
                onClick={this.handleSubmit}
                bsStyle="primary"
                disabled={!isValid || isSubmitting}
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
