import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import * as constants from "../../constants"
import React from "react"

const FormBody = ({ values, snapshot }) => (
  <Modal.Body>
    <Form.Errors />

    {snapshot ? (
      <>
        <p className="alert alert-notice">
          Reverts a share to the specified snapshot, which must be the most
          recent one known to manila.
        </p>
        <Form.ElementHorizontal label="Snapshot ID" name="snapshot_id" required>
          <Form.Input
            elementType="input"
            className="select required form-control"
            name="snapshot_id"
          ></Form.Input>
        </Form.ElementHorizontal>
      </>
    ) : (
      <p className="alert alert-notice">
        No snapshot found to which you can revert.
      </p>
    )}
  </Modal.Body>
)

export default class ResetShareStatusForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    if (!this.props.share) {
      this.props.loadShare().catch((loadError) => this.setState({ loadError }))
    }
    this.props.loadSnapshotsOnce()
  }

  validate = (values) => {
    return values.snapshot_id && true
  }

  close = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  restoreUrl = (e) => {
    if (!this.state.show)
      this.props.history.replace(`/${this.props.match.params.parent}`)
  }

  onSubmit = (values) => {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  recentSnapshot = () => {
    if (!this.props.snapshots || this.props.snapshots.length == 0) return null
    let sortedSnapshots = this.props.snapshots.sort((a, b) => {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return sortedSnapshots[0]
  }

  render() {
    const { share, isFetchingSnapshots } = this.props
    let recentSnapshot = this.recentSnapshot()
    const initialValues = recentSnapshot
      ? {
          snapshot_id: recentSnapshot.id,
        }
      : {}

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        onExited={this.restoreUrl}
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Revert Share To Snapshot
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          {share && !isFetchingSnapshots ? (
            <FormBody snapshot={recentSnapshot} />
          ) : (
            <Modal.Body>
              <span className="spinner"></span>
              Loading...
            </Modal.Body>
          )}

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Revert" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
