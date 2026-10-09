/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
import ReactModal from "./modal"

const ReactErrorDialog = ({ title, message, close }) => (
  <div>
    <div className="modal-body">
      {title ? (
        <h4 className="text-danger">
          <i className="fa fa-fw fa-exclamation-triangle" />
          {title}
        </h4>
      ) : undefined}
      {message ? (
        <div className="text-danger">
          {!title ? (
            <i className="fa fa-fw fa-exclamation-triangle" />
          ) : undefined}
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

export default ReactModal.Wrapper("Error", ReactErrorDialog, {
  closeButton: false,
  static: false,
})
