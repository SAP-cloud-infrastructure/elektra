import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import List from "./list"

const ModalAuth = (props) => (
  <Modal
    show={props.showModal}
    onHide={props.toggleModal}
    className="identity"
    bsSize="large"
    aria-labelledby="contained-modal-title-lg"
  >
    <Modal.Header closeButton={true}>
      <Modal.Title id="contained-modal-title-lg">
        {props.title ? props.title : `Your Projects (${props.items.length})`}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <div className="projects">
        <List
          className="content-list"
          items={props.items}
          isFetching={props.isFetching}
          showSearchInput={true}
          title={false}
          loadAuthProjectsOnce={props.loadAuthProjectsOnce}
        />
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={props.toggleModal}>Close</Button>
    </Modal.Footer>
  </Modal>
)

export default ModalAuth
