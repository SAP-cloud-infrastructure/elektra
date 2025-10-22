/* eslint-disable no-undef */
import { connect } from "react-redux"
import React from "react"
import ReactHelpers from "./helpers"

const ReactModal = {
  SHOW_MODAL: "SHOW_MODAL",
  HIDE_MODAL: "HIDE_MODAL",
  HIDE_ALL: "HIDE_ALL",
}

ReactModal.Wrapper = (title, WrappedComponent, options = {}) =>
  connect((state) => state)((props) => {
    const modalRef = React.useRef()

    const close = React.useCallback(
      (e, _callback) => {
        if (e) e.preventDefault()
        // bug in react. Instead of one parameter the onClick callback provides
        // two parameters. The first is a Proxy object (don't know what it is).
        // Deactivate the callback feature until fixed.
        // $(@refs.modal).on('hidden.bs.modal', callback) if callback
        $(modalRef.current).modal("hide")
      },
      [modalRef.current]
    )

    const handleClose = React.useCallback(() => {
      if (props.dispatch)
        props.dispatch({
          type: ReactModal.HIDE_MODAL,
          modalType: props.modalType,
        })
    }, [props.dispatch, props.modalType])

    React.useEffect(() => {
      if (!modalRef.current) return
      $(modalRef.current).modal("show")
      $(modalRef.current).on("hidden.bs.modal", handleClose)
    }, [modalRef.current, handleClose])

    options = ReactHelpers.mergeObjects({ closeButton: true }, options)
    let modalProps = props.modalProps || {}
    let childProps = ReactHelpers.mergeObjects(props, { close: close })
    delete childProps.modalProps
    childProps = ReactHelpers.mergeObjects(childProps, modalProps)

    return (
      <div
        className="modal fade"
        data-backdrop={options.static === true ? "static" : true}
        tabIndex="-1"
        ref={modalRef}
        role="dialog"
      >
        <div
          className={`modal-dialog ${options.large ? "modal-lg" : ""} ${
            options.xlarge ? "modal-xl" : ""
          }`}
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              {options.closeButton && (
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">x</span>
                </button>
              )}
              <h4 className="modal-title">{title}</h4>
            </div>
            <WrappedComponent {...childProps} />
          </div>
        </div>
      </div>
    )
  })

ReactModal.Reducer = (state = [], action) => {
  switch (action.type) {
    case ReactModal.SHOW_MODAL: {
      for (const m of state) {
        if (m.modalType === action.modalType) {
          return state
        }
      }

      const newState = state.slice()
      newState.push({
        modalType: action.modalType,
        modalProps: action.modalProps,
      })
      // addModalUrlFragment(action)
      return newState
    }
    case ReactModal.HIDE_MODAL: {
      let newState = state.slice()
      for (const i in state) {
        const m = state[i]
        if (m.modalType === action.modalType) newState.splice(i, 1)
      }
      // removeModalUrlFragment(action)
      return newState
    }
    case ReactModal.HIDE_ALL:
      return []
    default:
      return state
  }
}

ReactModal.Container = (reducerName, componentsMap) =>
  connect((state) => ({
    modals: state[reducerName],
  }))(({ modals }) =>
    modals && modals.length ? (
      <div>
        {modals.map(
          (modal) =>
            modal.modalType &&
            componentsMap[modal.modalType] &&
            React.createElement(componentsMap[modal.modalType], {
              key: modal.modalType,
              modalType: modal.modalType,
              modalProps: modal.modalProps,
            })
        )}
      </div>
    ) : null
  )

export default ReactModal
