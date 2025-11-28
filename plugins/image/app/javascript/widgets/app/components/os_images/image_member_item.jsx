/* eslint-disable no-undef */
import React from "react"

export default class ImageMemberItem extends React.Component {
  state = {
    confirm: false,
  }

  handleDelete = () => {
    if (this.state.confirm) {
      this.props.handleDelete()
    } else {
      this.setState({ confirm: true })
      setTimeout(() => this.setState({ confirm: false }), 3000)
    }
  }
  handleReject = () => {
    if (this.state.confirm) {
      this.props.handleReject()
    } else {
      this.setState({ confirm: true })
      setTimeout(() => this.setState({ confirm: false }), 3000)
    }
  }

  render() {
    const canRemoveMember =
      policy.isAllowed("image:member_delete", { image: this.props.image }) && !this.props.member.isDeleting

    const canReject =
      policy.isAllowed("image:member_reject", { image: this.props.image }) && this.props.member.status === "accepted"

    return (
      <tr className={this.props.member.isDeleting && "updating"}>
        <td>
          {this.props.image?.owner_project_name || "-"}
          <br />
          <span className="info-text">{this.props.image?.owner}</span>
        </td>
        <td>
          {this.props.member.target_name}
          <br />
          <span className="info-text">{this.props.member.member_id}</span>
        </td>
        <td>{this.props.member.status}</td>
        <td>
          {canRemoveMember ? (
            <button
              className="btn btn-danger btn-sm pull-right"
              onClick={(e) => {
                e.preventDefault()
                this.handleDelete()
              }}
              disabled={this.props.member.isDeleting}
            >
              {this.state.confirm ? "Confirm" : <i className="fa fa-minus" />}
            </button>
          ) : (
            canReject && (
              <button
                className="btn btn-warning btn-sm pull-right"
                onClick={(e) => {
                  e.preventDefault()
                  this.handleReject()
                }}
              >
                {this.state.confirm ? "Confirm" : "Revoke"}
              </button>
            )
          )}
        </td>
      </tr>
    )
  }
}
