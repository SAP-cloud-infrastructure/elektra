/* eslint-disable react/no-unescaped-entities */
import { Modal, Button } from "react-bootstrap"
import React from "react"
import { apiStateIsDeleting } from "../utils"

export default class AccountSubleaseTokenModal extends React.Component {
  state = {
    show: true,
    requested: false,
    token: null,
    error: null,
  }

  getTokenOnce = () => {
    if (this.state.requested || !this.props.isAdmin) {
      return
    }
    this.getToken()
  }

  getToken = () => {
    this.setState({ ...this.state, requested: true, token: null, error: null })
    this.props
      .getAccountSubleaseToken(this.props.account.name)
      .then((token) => this.setState({ ...this.state, token, error: null }))
      .catch((error) => this.setState({ ...this.state, token: null, error }))
  }

  close = (e) => {
    if (e) {
      e.stopPropagation()
    }
    this.setState({ ...this.state, show: false })
    setTimeout(() => this.props.history.replace("/accounts"), 300)
  }

  componentDidMount() {
    this.getTokenOnce()
  }
  componentDidUpdate() {
    this.getTokenOnce()
  }

  renderBody() {
    const { account, isAdmin } = this.props
    if (!account) {
      return <p className="alert alert-error">No such account.</p>
    }
    if(apiStateIsDeleting(account?.state)) {
      return <p className="alert alert-error">Account is in deletion state.</p>
    }
    if (!isAdmin) {
      return (
        <p className="alert alert-error">
          You are not allowed to issue sublease tokens.
        </p>
      )
    }
    const { token, error } = this.state
    if (error !== null) {
      return <p className="alert alert-error">Could not get token: {error}</p>
    }
    if (token === null) {
      return (
        <p>
          <span className="spinner" /> Requesting token...
        </p>
      )
    }
    return (
      <pre className="sublease-token">
        <code>{token}</code>
      </pre>
    ) //TODO make nicer
  }

  render() {
    return (
      //NOTE: className='keppel' on Modal ensures that plugin-specific CSS rules get applied
      <Modal
        className="keppel"
        backdrop="static"
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Sublease token for account: {this.props.account.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            When creating a replica of this account in another Converged Cloud
            region, you need to present this token to prove that you are the
            owner of this account.
          </p>
          {this.renderBody()}
          <p>
            Copy this token and paste it into the "Create New Account" dialog in
            another region when instructed. Each token can only be used exactly
            once. To create multiple replica accounts, you need to generate one
            token for each replica account.
          </p>
        </Modal.Body>
        <Modal.Footer>
          {this.state.token !== null && (
            <Button onClick={this.getToken}>Generate new token</Button>
          )}
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
