import { useMemo, useEffect } from "react"
import { Modal } from "react-bootstrap"
import ErrorPage from "../ErrorPage"
import React from "react"
import { JsonViewer } from "@cloudoperators/juno-ui-components"

const JsonView = ({ show, close, restoreUrl, title, jsonObject, loadObject }) => {
  return useMemo(() => {
    return (
      <Modal
        show={show}
        onHide={close}
        bsSize="large"
        backdrop="static"
        onExited={restoreUrl}
        aria-labelledby="contained-modal-title-lg"
        bsClass="lbaas2 modal"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">{title}</Modal.Title>
        </Modal.Header>

        {jsonObject.error ? (
          <Modal.Body>
            <ErrorPage headTitle={title} error={jsonObject.error} onReload={loadObject} />
          </Modal.Body>
        ) : (
          <Modal.Body>
            {jsonObject.isLoading ? (
              <Modal.Body>
                <span className="spinner" />
              </Modal.Body>
            ) : (
              <>{jsonObject.item && <JsonViewer data={jsonObject.item} theme="light" expanded={2} />}</>
            )}
          </Modal.Body>
        )}
      </Modal>
    )
  }, [show, title, JSON.stringify(jsonObject)])
}

export default JsonView
