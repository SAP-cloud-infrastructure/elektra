/* eslint-disable no-undef */
import { Modal, Button } from "react-bootstrap"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import ImageMemberItem from "./image_member_item"
import ImageMemberForm from "./image_member_form"
import { FormErrors } from "lib/elektra-form/components/form_errors"
import React from "react"

const FadeTransition = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={500} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

export default class ImageMembersModal extends React.Component {
  state = { show: true, showForm: false, error: null }

  restoreUrl = (e) => {
    if (!this.state.show) this.props.history.replace(`/os-images/${this.props.activeTab}`)
  }

  hide = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  toggleForm = () => {
    this.setState({ showForm: !this.state.showForm })
  }

  componentDidMount() {
    // load dependencies unless already loaded
    this.loadDependencies(this.props)
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.loadDependencies(props)
  }

  componentWillUnmount() {
    this.props?.image?.id && this.props.resetImageMembers(this.props.image.id)
  }

  loadDependencies(props) {
    if (!props.image || props.image.visibility != "shared") return
    const promise = props.loadMembersOnce(props.image.id)
    if (promise) promise.catch((error) => this.setState({ error }))
  }

  handleSubmit = (imageId, memberId) => {
    return this.props.handleSubmit(imageId, memberId).then(() => this.setState({ showForm: false }))
  }

  render() {
    let { image, imageMembers } = this.props

    return (
      <Modal
        show={this.state.show}
        onExited={this.restoreUrl}
        onHide={this.hide}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">Access Control for Image {image ? image.name : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {image && image.visibility != "shared" ? (
            <div className="alert alert-notice">
              Only shared images may contain members
              <br />
              {policy.isAllowed("image:image_visibility_to_shared", {
                image,
              }) && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    this.props.handleVisibilityChange(image.id, "shared")
                  }}
                >
                  Set to shared
                </a>
              )}
            </div>
          ) : (
            <>
              {this.state.error && <FormErrors errors={this.state.error} />}
              {!imageMembers || imageMembers.isFetching ? (
                <div>
                  <span className="spinner" />
                  Loading...
                </div>
              ) : (
                <table className="table share-rules">
                  <thead>
                    <tr>
                      <th>Owner Project</th>
                      <th>Target Project</th>
                      <th className="snug">Status</th>
                      <th className="actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {!imageMembers || imageMembers.items.length == 0 ? (
                      <tr>
                        <td colSpan="3">No members found.</td>
                      </tr>
                    ) : (
                      imageMembers.items.map((member, index) => (
                        <ImageMemberItem
                          key={index}
                          member={member}
                          image={image}
                          handleDelete={() => this.props.handleDelete(image.id, member.member_id)}
                          handleReject={() =>
                            this.props.handleReject(image.id).then(() => this.props.reloadMembers(image.id))
                          }
                        />
                      ))
                    )}

                    {policy.isAllowed("image:member_create", {
                      image: image,
                    }) && (
                      <tr>
                        <td>
                          <TransitionGroup>
                            {this.state.showForm && (
                              <FadeTransition>
                                <ImageMemberForm handleSubmit={(memberId) => this.handleSubmit(image.id, memberId)} />
                              </FadeTransition>
                            )}
                          </TransitionGroup>
                        </td>
                        <td></td>
                        <td></td>
                        <td>
                          <a
                            className={`btn btn-${this.state.showForm ? "default" : "primary"} btn-sm pull-right`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              this.toggleForm()
                            }}
                          >
                            <i className={`fa ${this.state.showForm ? "fa-close" : "fa-plus"}`} />
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.hide}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
