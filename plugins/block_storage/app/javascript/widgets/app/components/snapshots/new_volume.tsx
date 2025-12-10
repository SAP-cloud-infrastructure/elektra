// import React from "react"
// import { Modal, Button } from "react-bootstrap"
// import { Form } from "lib/elektra-form"

// const FormBody = ({ values, snapshot, volume }) => (
//   <Modal.Body>
//     <Form.Errors />

//     <Form.ElementHorizontal label="Source Snapshot" name="snapshot_id" required>
//       <p className="form-control-static">
//         {snapshot ? (
//           <>
//             {snapshot.name}
//             <br />
//             <span className="info-text">ID: {snapshot.id}</span>
//           </>
//         ) : (
//           values.snapshot_id
//         )}
//         {(volume || snapshot) && (
//           <span className="info-text">
//             <br />
//             Source Volume:&nbsp;
//             {volume ? (
//               <>
//                 {volume.name}
//                 <br />
//                 Availability Zone: {volume.availability_zone}
//                 <br />
//                 Size: {volume.size} GB
//               </>
//             ) : (
//               snapshot && snapshot.volume_id
//             )}
//           </span>
//         )}
//       </p>
//     </Form.ElementHorizontal>

//     <Form.ElementHorizontal label="Name" name="name" required>
//       <Form.Input elementType="input" type="text" name="name" />
//     </Form.ElementHorizontal>

//     <Form.ElementHorizontal label="Description" name="description" required>
//       <Form.Input elementType="textarea" className="text optional form-control" name="description" />
//     </Form.ElementHorizontal>
//   </Modal.Body>
// )

// export default class NewPortForm extends React.Component {
//   state = { show: true }

//   validate = (values) => {
//     return values.name && values.description && true
//   }

//   componentDidMount() {
//     this.loadDependencies(this.props)
//   }

//   UNSAFE_componentWillReceiveProps(nextProps) {
//     this.loadDependencies(nextProps)
//   }

//   loadDependencies = (props) => {
//     if (props.snapshot && !props.volume) {
//       props.loadVolume(props.snapshot.volume_id)
//     }
//   }

//   close = (e) => {
//     if (e) e.stopPropagation()
//     this.setState({ show: false })
//   }

//   restoreUrl = (e) => {
//     if (!this.state.show) this.props.history.replace(`/snapshots`)
//   }

//   onSubmit = (values) => {
//     return this.props.handleSubmit(values).then(() => this.close())
//   }

//   render() {
//     const { snapshot_id, snapshot, volume } = this.props
//     const initialValues = snapshot
//       ? {
//           snapshot_id,
//           name: `vol-${snapshot.name}`,
//           description: `Volume from snapshot ${snapshot.name}`,
//         }
//       : {
//           snapshot_id,
//           name: `vol-${snapshot_id}`,
//           description: `Volume from snapshot ${snapshot_id}`,
//         }

//     return (
//       <Modal
//         show={this.state.show}
//         onHide={this.close}
//         bsSize="large"
//         backdrop="static"
//         onExited={this.restoreUrl}
//         aria-labelledby="contained-modal-title-lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title id="contained-modal-title-lg">New Volume From Snpashot</Modal.Title>
//         </Modal.Header>

//         <Form
//           className="form form-horizontal"
//           validate={this.validate}
//           onSubmit={this.onSubmit}
//           initialValues={initialValues}
//         >
//           <FormBody snapshot={snapshot} volume={volume} />

//           <Modal.Footer>
//             <Button onClick={this.close}>Cancel</Button>
//             <Form.SubmitButton label="Save" />
//           </Modal.Footer>
//         </Form>
//       </Modal>
//     )
//   }
// }

import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"

interface Snapshot {
  id: string
  name: string
  volume_id: string
}

interface Volume {
  id: string
  name: string
  availability_zone: string
  size: number
}

interface FormValues {
  snapshot_id: string
  name: string
  description: string
}

interface FormBodyProps {
  values: FormValues
  snapshot: Snapshot | null
  volume: Volume | null
}

interface NewVolumeFormProps {
  snapshot_id: string
  snapshot: Snapshot | null
  volume: Volume | null
  loadVolume: (volumeId: string) => void
  handleSubmit: (values: FormValues) => Promise<void>
  history: {
    replace: (path: string) => void
  }
}

const FormBody: React.FC<FormBodyProps> = ({ values, snapshot, volume }) => (
  <Modal.Body>
    <Form.Errors />
    <Form.ElementHorizontal label="Source Snapshot" name="snapshot_id" required>
      <p className="form-control-static" name="snapshot_id">
        {snapshot ? (
          <>
            {snapshot.name}
            <br />
            <span className="info-text">ID: {snapshot.id}</span>
          </>
        ) : (
          values.snapshot_id
        )}
        {(volume || snapshot) && (
          <span className="info-text">
            <br />
            Source Volume:&nbsp;
            {volume ? (
              <>
                {volume.name}
                <br />
                Availability Zone: {volume.availability_zone}
                <br />
                Size: {volume.size} GB
              </>
            ) : (
              snapshot && snapshot.volume_id
            )}
          </span>
        )}
      </p>
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Name" name="name" required>
      <Form.Input elementType="input" type="text" name="name" id="name" />
    </Form.ElementHorizontal>

    <Form.ElementHorizontal label="Description" name="description" required>
      <Form.Input elementType="textarea" className="text optional form-control" name="description" id="description" />
    </Form.ElementHorizontal>
  </Modal.Body>
)

const NewVolumeForm: React.FC<NewVolumeFormProps> = ({
  snapshot_id,
  snapshot,
  volume,
  loadVolume,
  handleSubmit,
  history,
}) => {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (snapshot && !volume) {
      loadVolume(snapshot.volume_id)
    }
  }, [snapshot, volume, loadVolume])

  const validate = (values: FormValues): boolean => {
    return Boolean(values.name && values.description)
  }

  const close = (e?: React.MouseEvent): void => {
    if (e) {
      e.stopPropagation()
    }
    setShow(false)
  }

  const restoreUrl = (): void => {
    if (!show) {
      history.replace("/snapshots")
    }
  }

  const onSubmit = (values: FormValues): Promise<void> => {
    return handleSubmit(values).then(() => close())
  }

  const initialValues: FormValues = snapshot
    ? {
        snapshot_id,
        name: `vol-${snapshot.name}`,
        description: `Volume from snapshot ${snapshot.name}`,
      }
    : {
        snapshot_id,
        name: `vol-${snapshot_id}`,
        description: `Volume from snapshot ${snapshot_id}`,
      }

  return (
    <Modal
      show={show}
      onHide={close}
      bsSize="large"
      backdrop="static"
      onExited={restoreUrl}
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Volume From Snpashot</Modal.Title>
      </Modal.Header>

      <Form className="form form-horizontal" validate={validate} onSubmit={onSubmit} initialValues={initialValues}>
        <FormBody snapshot={snapshot} volume={volume} />

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewVolumeForm
