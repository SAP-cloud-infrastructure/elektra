/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
import ReactModal from "./modal"

const ReactConfirmDialog = ({
  title,
  message,
  confirmCallback,
  cancelCallback,
  close,
}) =>
  React.createElement(
    "div",
    null,
    <div className="modal-body">
      {title ? (
        <h4>
          <i className="confirm-icon fa fa-fw fa-exclamation-triangle" />
          {title}
        </h4>
      ) : undefined}
      {message ? (
        <p>
          {!title ? (
            <i className="confirm-icon fa fa-fw fa-exclamation-triangle" />
          ) : undefined}
          {message ? message : undefined}
        </p>
      ) : undefined}
    </div>,
    React.createElement(
      "div",
      { className: "modal-footer" },
      React.createElement(
        "button",
        {
          role: "cancel",
          type: "button",
          className: "btn btn-secondary",
          onClick() {
            close()
            if (cancelCallback) {
              return cancelCallback()
            }
          },
        },
        "No"
      ),
      React.createElement(
        "button",
        {
          role: "confirm",
          type: "button",
          className: "btn btn-primary",
          onClick() {
            close()
            if (confirmCallback) {
              return confirmCallback()
            }
          },
        },
        "Yes"
      )
    )
  )

export default ReactModal.Wrapper("Please Confirm", ReactConfirmDialog, {
  closeButton: false,
  static: true,
})
