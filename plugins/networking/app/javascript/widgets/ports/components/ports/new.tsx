import React, { useState, useEffect, useMemo } from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import ipRangeCheck from "ip-range-check"

// Type definitions
interface NetworkItem {
  id: string
  name: string
}

interface SubnetItem {
  id: string
  name: string
  network_id: string
  cidr: string
}

interface SecurityGroupItem {
  id: string
  name: string
}

interface NetworksState {
  items: NetworkItem[]
  isFetching: boolean
}

interface SubnetsState {
  items: SubnetItem[]
  isFetching: boolean
}

interface SecurityGroupsState {
  items: SecurityGroupItem[]
  isFetching: boolean
}

interface FormValues {
  network_id?: string
  subnet_id?: string
  ip_address?: string
  security_groups?: string[]
  description?: string
}

interface NewPortFormProps {
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  handleSubmit: (values: FormValues) => Promise<void>
  history: {
    replace: (path: string) => void
  }
}

interface FormBodyProps {
  values: FormValues
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
}

const FormBody: React.FC<FormBodyProps> = ({ values, networks, subnets, securityGroups }) => {
  const network_subnets: SubnetItem[] = []
  if (values.network_id && subnets.items && subnets.items.length > 0) {
    for (const subnet of subnets.items) {
      if (subnet.network_id === values.network_id) network_subnets.push(subnet)
    }
  }

  return (
    <Modal.Body>
      <Form.Errors />

      <Form.ElementHorizontal label="Network" required={true} name="network_id">
        {networks.isFetching ? (
          <span className="spinner" />
        ) : (
          <Form.Input elementType="select" className="select required form-control" name="network_id">
            <option></option>
            {networks.items.map((network) => (
              <option value={network.id} key={network.id}>
                {network.name}
              </option>
            ))}
          </Form.Input>
        )}
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="Subnet" required={true} name="subnet_id">
        {subnets.isFetching ? (
          <span className="spinner" />
        ) : (
          <Form.Input elementType="select" className="select required form-control" name="subnet_id">
            <option></option>

            {network_subnets.map((subnet) => (
              <option value={subnet.id} key={subnet.id}>
                {`${subnet.name} (${subnet.cidr})`}
              </option>
            ))}
          </Form.Input>
        )}
      </Form.ElementHorizontal>

      <Form.ElementHorizontal label="IP" name="ip_address">
        <Form.Input elementType="input" type="text" name="ip_address" />
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

const NewPortForm: React.FC<NewPortFormProps> = (props) => {
  const [show, setShow] = useState(true)

  // Load dependencies on mount and when props change
  useEffect(() => {
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }, [props.loadNetworksOnce, props.loadSubnetsOnce, props.loadSecurityGroupsOnce])

  const validate = (values: FormValues): boolean => {
    const subnet = props.subnets.items.find((s) => s.id === values.subnet_id)
    return !!(
      values.network_id &&
      values.subnet_id &&
      values.ip_address &&
      subnet &&
      ipRangeCheck(values.ip_address, subnet.cidr)
    )
  }

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => props.history.replace("/ports"), 300)
  }

  const onSubmit = (values: FormValues) => {
    return props.handleSubmit(values).then(() => close())
  }

  const defaultOptions = useMemo(() => {
    if (props.securityGroups && props.securityGroups.items) {
      return props.securityGroups.items.filter((i) => i.name === "default").map((i) => i.id)
    }
    return []
  }, [props.securityGroups])

  const initialValues: FormValues | null = defaultOptions.length > 0 ? { security_groups: defaultOptions } : null

  return (
    <Modal show={show} onHide={close} bsSize="large" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Fixed IP Reservation</Modal.Title>
      </Modal.Header>

      <Form className="form form-horizontal" validate={validate} onSubmit={onSubmit} initialValues={initialValues}>
        <FormBody networks={props.networks} subnets={props.subnets} securityGroups={props.securityGroups} values={{}} />

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewPortForm
