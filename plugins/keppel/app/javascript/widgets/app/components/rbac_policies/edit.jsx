/* eslint-disable react/no-unescaped-entities */
import { Modal, Button } from "react-bootstrap"
import { FormErrors } from "lib/elektra-form/components/form_errors"
import React from "react"
import RBACPoliciesEditRow from "./row"
import { apiStateIsDeleting } from "../utils"

export default class RBACPoliciesEditModal extends React.Component {
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
      const { rbac_policies: policies } = this.props.account
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

  setRepoRegex = (idx, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx], match_repository: input }
    this.setState({ ...this.state, policies })
  }
  setUserRegex = (idx, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx], match_username: input }
    this.setState({ ...this.state, policies })
  }
  setSourceCIDR = (idx, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx], match_cidr: input }
    this.setState({ ...this.state, policies })
  }
  setPermissions = (idx, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx], permissions: input.split(",") }
    if (input.includes("anonymous_pull") || input.includes("anonymous_first_pull")) {
      policies[idx].match_username = ""
    }
    this.setState({ ...this.state, policies })
  }
  setForbiddenPermissions = (idx, input) => {
    const policies = [...this.state.policies]
    policies[idx] = { ...policies[idx], forbidden_permissions: input === "" ? null : input.split(",") }
    if (input.includes("anonymous_pull") || input.includes("anonymous_first_pull")) {
      policies[idx].match_username = ""
    }
    this.setState({ ...this.state, policies })
  }
  removePolicy = (idx, input) => {
    const policies = this.state.policies.filter((p, index) => idx != index)
    this.setState({ ...this.state, policies })
  }
  addPolicy = (e) => {
    const newPolicy = {
      match_repository: "",
      match_username: "",
      permissions: [],
    }
    this.setState({
      ...this.state,
      policies: [...this.state.policies, newPolicy],
    })
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
    const newAccount = {
      ...this.props.account,
      rbac_policies: this.state.policies,
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
    const isExternalReplica =
      (account.replication || {}).strategy === "from_external_on_first_use"

    const policies = this.state.policies || []
    const { isSubmitting, errorMessage, apiErrors } = this.state

    const {
      setRepoRegex,
      setUserRegex,
      setSourceCIDR,
      setPermissions,
      setForbiddenPermissions,
      removePolicy,
    } = this
    const commonPropsForRow = {
      isEditable: isAdmin,
      isExternalReplica,
      setRepoRegex,
      setUserRegex,
      setSourceCIDR,
      setPermissions,
      setForbiddenPermissions,
      removePolicy,
    }

    return (
      <Modal
        backdrop="static"
        dialogClassName="modal-xl"
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Access policies for account: {account.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {this.state.apiErrors && <FormErrors errors={this.state.apiErrors} />}
          <p className="bs-callout bs-callout-info bs-callout-emphasize">
            By default, all users with the <code>registry_admin</code> role can
            pull, push and delete images. And all users with the{" "}
            <code>registry_viewer</code> role can pull images.
            <br />
            <br />
            Access policies are more granular: You can give specific users
            access to specific repositories within a single account if you want
            to. You can also use access policies to enable anonymous pulling,
            thereby making matching repositories publicly readable.
            {isExternalReplica && (
              <>
                <br />
                <br />
                Since this is an external replica account, anonymous users are
                not allowed to replicate new images. This is a safeguard against
                third parties cluttering your account. You can enable anonymous
                replication with the "Pull Anonymously (even new images)"
                permission, but make sure to only enable this permission for
                trusted source IPs.
              </>
            )}
          </p>
          <table className="table">
            <thead>
              <tr>
                <th className="col-md-3">Repositories matching</th>
                <th className="col-md-3">User names matching</th>
                <th className="col-md-2">Requests from (CIDR)</th>
                <th className="col-md-3">Permissions</th>
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
                <RBACPoliciesEditRow
                  {...commonPropsForRow}
                  key={idx}
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
              Matches use the{" "}
              <a href="https://golang.org/pkg/regexp/syntax/">
                Go regex syntax
              </a>
              . Leading <code>^</code> and trailing <code>$</code> anchors are
              always added automatically. User names are in the format{" "}
              <code>user@userdomain/project@projectdomain</code>.
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          {isAdmin ? (
            <>
              <Button
                onClick={this.handleSubmit}
                bsStyle="primary"
                disabled={isSubmitting}
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
