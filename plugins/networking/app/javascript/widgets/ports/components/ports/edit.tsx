import React, { useState, useEffect, useCallback } from "react"
// @ts-expect-error - react-bootstrap has no types
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - elektra-form has no types
import { Form } from "lib/elektra-form"


interface Network {
  id: string
  name: string
}

interface Networks {
  items: Network[]
}

interface Subnet {
  id: string
  name: string
}

interface Subnets {
  items: Subnet[]
}

interface SecurityGroup {
  id: string
  name: string
}

interface SecurityGroups {
  items: SecurityGroup[]
}

interface FixedIP {
  subnet_id: string
  ip_address: string
}

interface Port {
  id: string
  name: string
  network_id: string
  fixed_ips: FixedIP[]
  security_groups?: string[]
  description?: string
}

interface FormBodyProps {
  values?: Port
  networks: Networks | null
  subnets: Subnets | null
  securityGroups: SecurityGroups | null
}

const FormBody: React.FC<FormBodyProps> = ({ values, networks, subnets, securityGroups }) => {
  const network = networks && values ? networks.items.find((n) => n.id === values.network_id) : null

  const renderIp = (ip: FixedIP) => {
    let subnet = subnets && subnets.items.find((i) => i.id === ip.subnet_id)
    if (subnet)
      return (
        <>
          {ip.ip_address} <span className="info-text">{subnet.name}</span>
        </>
      )
    else return ip.ip_address
  }

  return (
    <Modal.Body>
      <Form.Errors />

      <Form.ElementHorizontal label="Network" required={true} name="network_id">
        <p className="form-control-static">{network && network.name}</p>
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="Fixed IPs" required name="fixed_ips">
        {values?.fixed_ips &&
          values.fixed_ips.map((ip, index) => (
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

interface EditPortFormProps {
  port: Port | null
  networks: Networks | null
  subnets: Subnets | null
  securityGroups: SecurityGroups | null
  history: {
    replace: (path: string) => void
  }
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  handleSubmit: (values: Port) => Promise<any>
}

const EditPortForm: React.FC<EditPortFormProps> = ({
  port,
  networks,
  subnets,
  securityGroups,
  history,
  loadNetworksOnce,
  loadSubnetsOnce,
  loadSecurityGroupsOnce,
  handleSubmit,
}) => {
  const [show, setShow] = useState(true)

  // Load dependencies (replaces componentDidMount and UNSAFE_componentWillReceiveProps)
  const loadDependencies = useCallback(() => {
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
  }, [loadNetworksOnce, loadSubnetsOnce, loadSecurityGroupsOnce])

  // Initialize on mount
  useEffect(() => {
    loadDependencies()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load dependencies when props change (replaces UNSAFE_componentWillReceiveProps)
  useEffect(() => {
    loadDependencies()
  }, [loadDependencies])

  const validate = useCallback((values: Port) => {
    return true
  }, [])

  const close = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      setShow(false)
      setTimeout(() => history.replace("/ports"), 300)
    },
    [history]
  )

  const onSubmit = useCallback(
    (values: Port) => {
      return handleSubmit(values).then(() => close())
    },
    [handleSubmit, close]
  )

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
