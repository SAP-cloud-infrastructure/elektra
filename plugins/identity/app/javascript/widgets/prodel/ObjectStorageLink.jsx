import React from "react"
import { Icon, Modal, Select, SelectOption } from "@cloudoperators/juno-ui-components"

// The object_storage plugin serves two backends (Swift and Ceph) behind a required
// :service_name URL segment, e.g. /<domain>/<project>/object-storage/swift/containers.
// Prodel does not reliably tell us which backend a container lives in, so we let the
// user pick (defaulting to Swift) before jumping into the plugin.
export default function ObjectStorageLink({ domainFid, projectFid, serviceType }) {
  const [showModal, setShowModal] = React.useState(false)
  const [service, setService] = React.useState("swift")

  const onConfirm = () => {
    const url = `/${domainFid}/${projectFid}/object-storage/${service}/containers`
    window.open(url, "_blank", "noopener")
    setShowModal(false)
  }

  return (
    <>
      <Icon
        color="jn-global-text"
        icon="openInNew"
        onClick={() => setShowModal(true)}
        title={`Jump to ${serviceType}`}
      />
      <Modal
        open={showModal}
        title="Open Object Storage"
        confirmButtonLabel="Open"
        onConfirm={onConfirm}
        onCancel={() => setShowModal(false)}
      >
        <p className="tw-mb-4">Select the object storage backend you want to open:</p>
        <Select label="Backend" defaultValue="swift" onChange={(value) => setService(value)}>
          <SelectOption label="Swift" value="swift" />
          <SelectOption label="Ceph" value="ceph" />
        </Select>
      </Modal>
    </>
  )
}
