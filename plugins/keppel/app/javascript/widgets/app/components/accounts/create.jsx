/* eslint-disable react/no-unescaped-entities */
import { useContext } from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { Base64 } from "js-base64"
import React from "react"

const initialValues = {
  role: "",
  name: "",
  url: "",
  username: "",
  password: "",
  token: "",
}

const roleInfoTexts = {
  primary:
    "You can push images into this account. Accounts in other regions can replicate from this account.",
  replica:
    "This account replicates images from a primary account in a different region with the same name. You cannot push images into this account directly. Images are replicated on first use, when a client first tries to pull them.",
  external_replica:
    "This account replicates images from a registry outside of Keppel (e.g. Docker Hub). You cannot push images into this account directly. Images are replicated on first use, when a client first tries to pull them. Only pulls by authenticated users can trigger replication.",
}

const decodeSubleaseToken = (token) => {
  try {
    const t = JSON.parse(Base64.decode(token))
    if (t.account && t.primary && t.secret) {
      return t
    } else {
      return {} //looks incomplete
    }
  } catch {
    return {} //looks broken
  }
}

const isValidSubleaseToken = (token) => {
  return token.account && token.primary && token.secret ? true : false
}

const BackingStorageInfo = ({ accountName }) => (
  <Form.ElementHorizontal label="Backing storage" name="backing_storage">
    <p className="form-control-static">
      Swift container <strong>keppel-{accountName}</strong>
      <br />
      <span className="text-muted">
        The container will be created if it does not exist yet. Please ensure
        that you have sufficient object storage quota.
      </span>
    </p>
  </Form.ElementHorizontal>
)

const FormBody = ({ values }) => {
  const accountName = values.name || ""
  const roleInfoText = roleInfoTexts[values.role || ""]

  const decodedToken = decodeSubleaseToken(values.token)
  const { account: accountNameFromToken, primary: primaryHostNameFromToken } =
    decodedToken
  const isValidToken = isValidSubleaseToken(decodedToken)

  return (
    <Modal.Body>
      <Form.Errors />

      <Form.ElementHorizontal label="Role" name="role" required>
        <Form.Input elementType="select" name="role">
          {values.role ? null : <option value="">-- Please select --</option>}
          <option value="primary">Primary account</option>
          <option value="replica">Replica account</option>
          <option value="external_replica">External replica account</option>
        </Form.Input>
        {roleInfoText && <p className="form-control-static">{roleInfoText}</p>}
      </Form.ElementHorizontal>

      {(values.role == "primary" || values.role == "external_replica") && (
        <>
          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          {accountName ? (
            <>
              <BackingStorageInfo accountName={accountName} />

              {values.role == "external_replica" && (
                <>
                  <Form.ElementHorizontal
                    label="Upstream source"
                    name="url"
                    required
                  >
                    <Form.Input elementType="input" type="text" name="url" />
                    <p className="form-control-static">
                      {
                        'Enter the domain name of a registry (for Docker Hub, use "index.docker.io"). If you only want to replicate images below a certain path, append the path after the domain name (e.g. "gcr.io/google_containers").'
                      }
                    </p>
                  </Form.ElementHorizontal>

                  <Form.ElementHorizontal label="User name" name="username">
                    <Form.Input
                      elementType="input"
                      type="text"
                      name="username"
                    />
                  </Form.ElementHorizontal>

                  <Form.ElementHorizontal label="Password" name="password">
                    <Form.Input
                      elementType="input"
                      type="password"
                      name="password"
                    />
                    <p className="form-control-static">
                      These credentials are used by Keppel to pull images from
                      the upstream source. Leave blank to pull as an anonymous
                      user.
                    </p>
                  </Form.ElementHorizontal>

                  <Form.ElementHorizontal
                    label="Platform filter"
                    name="platform_filter"
                  >
                    <Form.Input
                      elementType="input"
                      type="checkbox"
                      name="platform_filter_linux_amd64"
                    />{" "}
                    Only x86_64 Linux
                    <p className="form-control-static">
                      When replicating a multi-architecture images, a platform
                      filter restricts which parts get replicated. Custom
                      platform filters can be defined when using the Keppel API
                      directly.
                    </p>
                  </Form.ElementHorizontal>
                </>
              )}

              <Form.ElementHorizontal label="Advanced" name="advanced">
                <p className="form-control-static text-muted">
                  You can set up access policies and validation rules after the
                  account has been created.
                </p>
              </Form.ElementHorizontal>
            </>
          ) : null}
        </>
      )}

      {values.role == "replica" && (
        <>
          <Form.ElementHorizontal label="Sublease token" name="token" required>
            <Form.Input elementType="input" type="text" name="token" />
            {!isValidToken && (
              <p className="form-control-static">
                If you do not have a sublease token yet, open the Converged
                Cloud dashboard in the region hosting the primary account and
                select "Issue Sublease Token" from the account's dropdown menu.
              </p>
            )}

            {values.token && !isValidToken && (
              <p className="form-control-static text-danger">
                This token does not look quite right. Try clearing the input
                field and pasting again.
              </p>
            )}
          </Form.ElementHorizontal>

          {isValidToken && (
            <>
              <Form.ElementHorizontal label="Name" name="name">
                <p className="form-control-static">
                  <strong>{accountNameFromToken}</strong>
                </p>
              </Form.ElementHorizontal>

              <BackingStorageInfo accountName={accountNameFromToken} />

              <Form.ElementHorizontal label="Primary account" name="primary">
                <p className="form-control-static">
                  This account will replicate from{" "}
                  <strong>
                    {primaryHostNameFromToken}/{accountNameFromToken}
                  </strong>
                  .
                </p>
              </Form.ElementHorizontal>

              <Form.ElementHorizontal label="Advanced" name="advanced">
                <p className="form-control-static text-muted">
                  You can set up access policies after the account has been
                  created.
                </p>
              </Form.ElementHorizontal>
            </>
          )}
        </>
      )}
    </Modal.Body>
  )
}

export default class AccountCreateModal extends React.Component {
  state = {
    show: true,
  }

  close = (e) => {
    if (e) {
      e.stopPropagation()
    }
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/accounts"), 300)
  }

  validate = ({ role, name, token, url, username, password }) => {
    switch (role) {
      case "primary":
        return name && true
      case "replica":
        return isValidSubleaseToken(decodeSubleaseToken(token))
      case "external_replica":
        return name && url && true
      default:
        return false
    }
  }

  onSubmit = ({
    role,
    name,
    token,
    url,
    username,
    password,
    platform_filter_linux_amd64: withPlatformFilter,
  }) => {
    const invalid = (field, reason) =>
      Promise.reject({ errors: { [field]: reason } })

    const newAccount = { auth_tenant_id: this.props.projectID }
    const reqHeaders = {}

    switch (role) {
      case "primary":
        newAccount.name = name
        break

      case "replica": {
        const t = decodeSubleaseToken(token)
        if (!isValidSubleaseToken(t)) {
          return invalid("token", "is not valid")
        }
        newAccount.name = t.account
        newAccount.replication = {
          strategy: "on_first_use",
          upstream: t.primary,
        }
        reqHeaders["X-Keppel-Sublease-Token"] = token
        break
      }
      case "external_replica":
        newAccount.name = name
        newAccount.replication = {
          strategy: "from_external_on_first_use",
          upstream: { url, username, password },
        }
        if (username != "" && password == "") {
          return invalid("password", "must be given if username is given")
        }
        if (username == "" && password != "") {
          return invalid("username", "must be given if password is given")
        }
        if (withPlatformFilter === true) {
          newAccount.platform_filter = [{ os: "linux", architecture: "amd64" }]
        }
        break

      default:
        return invalid("role", "is missing")
    }

    if (!/^[a-z0-9][a-z0-9-]*$/.test(newAccount.name)) {
      return invalid(
        "name",
        "must start with a lowercase letter or digit and may then only contain lowercase letters, digits, and dashes"
      )
    }
    if (newAccount.name.length > 48) {
      return invalid("name", "must not be longer than 48 chars")
    }
    if (this.props.existingAccountNames.includes(newAccount.name)) {
      return invalid("name", "is already in use")
    }

    return this.props
      .putAccount(newAccount, reqHeaders)
      .then(() => this.close())
  }

  render() {
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
            Create New Keppel Account
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
            <Form.SubmitButton label="Create" />
            <Button onClick={this.close}>Cancel</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
