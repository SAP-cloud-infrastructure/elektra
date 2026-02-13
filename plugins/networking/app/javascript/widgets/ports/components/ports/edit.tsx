import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - elektra-form has no types
import { Form } from "lib/elektra-form"

// Types
interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  fixed_ips?: Array<{ ip_address: string; subnet_id: string }>
  security_groups?: string[]
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
  network_id: string
}

interface SecurityGroup {
  id: string
  name: string
}

interface NetworksState {
  items: Network[]
  isFetching: boolean
}

interface SubnetsState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroupsState {
  items: SecurityGroup[]
  isFetching: boolean
}

interface History {
  replace: (path: string) => void
}

interface EditPortFormProps {
  port?: Port
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  handleSubmit: (values: any) => Promise<any>
  history: History
}

interface FormBodyProps {
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
}

const FormBody: React.FC<FormBodyProps> = ({ networks, subnets, securityGroups }) => {
  const values = Form.useFormValues?.() || {}
  const network = networks && networks.items.find((n) => n.id === values.network_id)

  const renderIp = (ip: { ip_address: string; subnet_id: string }) => {
    const subnet = subnets && subnets.items.find((i) => i.id === ip.subnet_id)
    if (subnet) {
      return (
        <>
          {ip.ip_address} <span className="info-text">{subnet.name}</span>
        </>
      )
    }
    return ip.ip_address
  }

  return (
    <Modal.Body>
      <Form.Errors />

      <Form.ElementHorizontal label="Network" required={true} name="network_id">
        <p className="form-control-static">{network && network.name}</p>
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="Fixed IPs" required name="fixed_ips">
        {values.fixed_ips &&
          values.fixed_ips.map((ip: { ip_address: string; subnet_id: string }, index: number) => (
            <div key={index} className="form-control-static">
              {renderIp(ip)}
            </div>
          ))}
      </Form.ElementHorizontal>

      {securityGroups && securityGroups.items && securityGroups.items.length > 0 && (
        <Form.ElementHorizontal label="Security Groups" name="security_groups">
          <Form.FormMultiselect
            name="security_groups"
            options={securityGroups.items}
            showSelectedLabel={true}
            selectedLabelLength={3}
            showIDs
          />
        </Form.ElementHorizontal>
      )}

      <Form.ElementHorizontal label="Description" name="description">
        <Form.Input elementType="textarea" className="text optional form-control" name="description" />
      </Form.ElementHorizontal>
    </Modal.Body>
  )
}

const EditPortForm: React.FC<EditPortFormProps> = ({
  port,
  networks,
  subnets,
  securityGroups,
  loadNetworksOnce,
  loadSubnetsOnce,
  loadSecurityGroupsOnce,
  handleSubmit,
  history,
}) => {
  const [show, setShow] = useState(true)

  useEffect(() => {
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
  }, [loadNetworksOnce, loadSubnetsOnce, loadSecurityGroupsOnce, port, networks, subnets, securityGroups])

  const validate = () => {
    return true
  }

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/ports"), 300)
  }

  const onSubmit = (values: any) => {
    return handleSubmit(values).then(() => close())
  }

  return (
    <Modal show={show} onHide={close} bsSize="large" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">Edit Port {port && `${port.name} (${port.id})`}</Modal.Title>
      </Modal.Header>

      <Form className="form form-horizontal" validate={validate} onSubmit={onSubmit} initialValues={port}>
        {!port ? (
          <Modal.Body>
            <span className="spinner"></span> Loading ...
          </Modal.Body>
        ) : (
          <FormBody networks={networks} subnets={subnets} securityGroups={securityGroups} />
        )}

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default EditPortForm
