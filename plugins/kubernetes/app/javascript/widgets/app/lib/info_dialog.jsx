/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
import ReactModal from "./modal"

const ReactInfoDialog = ({ title, message, close }) => (
  <div>
    <div className="modal-body">
      {title ? (
        <h4>
          <i className="fa fa-fw fa-info-circle" />
          {title}
        </h4>
      ) : undefined}
      {message ? (
        <div>
          {!title ? <i className="fa fa-fw fa-info-circle" /> : undefined}
          {message ? message : undefined}
        </div>
      ) : undefined}
    </div>
    <div className="modal-footer">
      <button
        role="cancel"
        type="button"
        className="btn btn-secondary"
        onClick={close}
      >
        Close
      </button>
    </div>
  </div>
)

const ReactInfoDialogWrapper = ReactModal.Wrapper("Info", ReactInfoDialog, {
  closeButton: false,
  static: true,
})

export default ReactInfoDialogWrapper
