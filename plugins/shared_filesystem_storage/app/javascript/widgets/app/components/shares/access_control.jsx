import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import AccessControlItem from "./access_control_item"
import AccessControlForm from "./access_control_form"
import React from "react"

const FadeTransition = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={500} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

export default class AccessControlModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true, showForm: false }
    this.close = this.close.bind(this)
    this.toggleForm = this.toggleForm.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  close(e) {
    if (e) e.stopPropagation()
    //this.props.history.goBack()
    this.setState({ show: false })
    setTimeout(
      () => this.props.history.replace(`/${this.props.match.params.parent}`),
      300
    )
  }

  toggleForm() {
    this.setState({ showForm: !this.state.showForm })
  }

  handleSubmit(values) {
    return this.props
      .handleSubmit(values)
      .then(() => this.setState({ showForm: false }))
  }

  render() {
    let { share, shareRules, shareNetwork, handleSubmit, handleDelete } =
      this.props

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
            Access Control for Share {share ? share.name : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {shareRules && shareRules.isFetching ? (
            <div>
              <span className="spinner" />
              Loading...
            </div>
          ) : (
            <table className="table share-rules">
              <thead>
                <tr>
                  <th>Access Type</th>
                  <th>Access to</th>
                  <th>Access Level</th>
                  <th>Status</th>
                  <th className="snug"></th>
                </tr>
              </thead>
              <tbody>
                {!shareRules || shareRules.items.length == 0 ? (
                  <tr>
                    <td colSpan="5">No Rules found.</td>
                  </tr>
                ) : (
                  shareRules.items.map((rule) => (
                    <AccessControlItem
                      key={rule.id}
                      rule={rule}
                      shareNetwork={shareNetwork}
                      handleDelete={() => handleDelete(share.id, rule.id)}
                    />
                  ))
                )}

                <tr>
                  <td colSpan="4">
                    <TransitionGroup>
                      {this.state.showForm && (
                        <FadeTransition>
                          <AccessControlForm
                            share={share}
                            shareNetwork={shareNetwork}
                            handleSubmit={this.handleSubmit}
                          />
                        </FadeTransition>
                      )}
                    </TransitionGroup>
                  </td>
                  <td>
                    <a
                      className={`btn btn-${
                        this.state.showForm ? "default" : "primary"
                      } btn-sm`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        this.toggleForm()
                      }}
                    >
                      <i
                        className={`fa ${
                          this.state.showForm ? "fa-close" : "fa-plus"
                        }`}
                      />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
