import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { PrettyDate } from "lib/components/pretty_date"
import { PrettySize } from "lib/components/pretty_size"
import { JsonViewer } from "@cloudoperators/juno-ui-components"
import { ImageIcon } from "./icon"
import React from "react"

const Row = ({ label, value, children }) => {
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value ? `${value}` : children}</td>
    </tr>
  )
}

const ShowModal = ({ activeTab, image, loadImage, ...props }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  const restoreUrl = React.useCallback(
    (e) => {
      if (!isVisible) props.history.replace(`/os-images/${activeTab}`)
    },
    [activeTab, isVisible]
  )

  const hide = React.useCallback((e) => {
    if (e) e.stopPropagation()
    setIsVisible(false)
  }, [])

  React.useEffect(() => {
    setIsVisible(!!image)
    if (!image) loadImage()
  }, [image])

  return (
    <Modal
      show={isVisible}
      onExited={restoreUrl}
      onHide={hide}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton={true}>
        <Modal.Title id="contained-modal-title-lg">Image {image ? image.name : ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {image && (
          <Tabs defaultActiveKey="details" id="uncontrolled-tab-example">
            <Tab eventKey="details" title="Details">
              <h3>
                <ImageIcon image={image} /> {image.name}
              </h3>
              <br />
              <table className="table no-borders">
                <tbody>
                  <Row label="Name" value={image.name} />
                  <Row label="ID" value={image.id} />
                  <Row label="Owner Project">
                    {image.project_name || image.owner}
                    {image.project_name && (
                      <span className="info-text">
                        <br />
                        {image.owner}
                      </span>
                    )}
                  </Row>
                  <Row label="Container Format" value={image.container_format} />
                  <Row label="Disk Format" value={image.disk_format} />
                  <Row label="Visibility" value={image.visibility} />
                  <Row label="Status" value={image.status} />
                  <Row label="Tags">{image.tags && image.tags.map((tag, index) => <div key={index}>{tag}</div>)}</Row>
                  <Row label="Min Disk" value={image.min_disk && `${image.min_disk} GB`} />
                  <Row label="Protected" value={image.protected} />
                  <Row label="File" value={image.file} />
                  <Row label="Checksum" value={image.checksum} />
                  <Row label="Size">
                    <PrettySize size={image.size} />
                  </Row>
                  <Row label="Min Ram" value={image.min_ram && `${image.min_ram} MB`} />
                  <Row label="Schema" value={image.schema} />
                  {image.hypervisor_type && <Row label="Hypervisor Type" value={image.hypervisor_type} />}
                  {image.vmware_ostype && <Row label="Vmware OS Type" value={image.vmware_ostype} />}
                  {image.virtual_size && (
                    <Row label="Virtual Size">
                      <PrettySize size={image.virtual_size} />
                    </Row>
                  )}
                  {image.vmware_disktype && <Row label="Vmware Disktype" value={image.vmware_disktype} />}
                  {image.vmware_adaptertype && <Row label="Vmware Adaptertype" value={image.vmware_adaptertype} />}
                  {image.base_image_ref && <Row label="Base Image Ref" value={image.base_image_ref} />}
                  {image.user_id && <Row label="User ID" value={image.user_id} />}
                  {image.image_type && <Row label="Image Type" value={image.image_type} />}
                  {image.instance_uuid && <Row label="Instance UUID" value={image.instance_uuid} />}
                  {image.hw_video_ram && <Row label="HW Video RAM" value={image.hw_video_ram} />}
                  {image.hw_vif_model && <Row label="HW VIF Model" value={image.hw_vif_model} />}
                  {image.hw_disk_bus && <Row label="HW Disk BUS" value={image.hw_disk_bus} />}
                  {image.buildnumber && <Row label="Buildnumber" value={image.buildnumber} />}
                  {image.architecture && <Row label="Architecture" value={image.architecture} />}

                  <Row label="Created At">
                    <PrettyDate date={image.created_at} />
                  </Row>
                  <Row label="Updated At">
                    <PrettyDate date={image.updated_at} />
                  </Row>
                  {/*image.password_0 && <Row label='Password 0'>{image.password_0}</Row>*/}
                  {/*image.password_1 && <Row label='Password 1'>{image.password_1}</Row>*/}
                  {/*image.password_2 && <Row label='Password 2'>{image.password_2}</Row>*/}
                  {/*image.password_3 && <Row label='Password 3'>{image.password_3}</Row>*/}
                </tbody>
              </table>
            </Tab>
            <Tab eventKey="raw" title="RAW">
              <JsonViewer data={image} theme="light" showRoot />
            </Tab>
          </Tabs>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={hide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowModal
