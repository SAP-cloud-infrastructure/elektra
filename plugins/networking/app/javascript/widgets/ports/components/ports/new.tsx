import React, { useState, useEffect } from "react"
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - no types available
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import ipRangeCheck from "ip-range-check"

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
  network_id: string
  cidr: string
}

interface SecurityGroup {
  id: string
  name: string
}

interface NetworkState {
  items: Network[]
  isFetching: boolean
}

interface SubnetState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroupState {
  items: SecurityGroup[]
  isFetching: boolean
}

interface FormValues {
  network_id?: string
  subnet_id?: string
  ip_address?: string
  security_groups?: string[]
  description?: string
}

interface FormBodyProps {
  values: FormValues
  networks: NetworkState
  subnets: SubnetState
  securityGroups: SecurityGroupState
}

interface NewPortFormProps {
  networks: NetworkState
  subnets: SubnetState
  securityGroups: SecurityGroupState
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  handleSubmit: (values: FormValues) => Promise<void>
  history: {
    replace: (path: string) => void
  }
}

const FormBody: React.FC<FormBodyProps> = ({ values, networks, subnets, securityGroups }) => {
  let network_subnets: Subnet[] = []
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
            {networks.items.map((network, index) => (
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

            {network_subnets.map((subnet, index) => (
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

const NewPortForm: React.FC<NewPortFormProps> = ({
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

  // Load dependencies on mount and when they change
  useEffect(() => {
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
  }, [loadNetworksOnce, loadSubnetsOnce, loadSecurityGroupsOnce])

  const validate = (values: FormValues): boolean => {
    const subnet = subnets.items.find((s) => s.id === values.subnet_id)
    if (!subnet) return false
    return !!(
      values.network_id &&
      values.subnet_id &&
      values.ip_address &&
      ipRangeCheck(values.ip_address, subnet.cidr)
    )
  }

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/ports"), 300)
  }

  const onSubmit = (values: FormValues) => {
    return handleSubmit(values).then(() => close())
  }

  let defaultOptions: string[] = []
  if (securityGroups && securityGroups.items) {
    defaultOptions = securityGroups.items.filter((i) => i.name === "default").map((i) => i.id)
  }

  const initialValues: FormValues | null = defaultOptions.length > 0 ? { security_groups: defaultOptions } : null

  return (
    <Modal show={show} onHide={close} size="lg" aria-labelledby="contained-modal-title-lg">
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">New Fixed IP Reservation</Modal.Title>
      </Modal.Header>

      <Form className="form form-horizontal" validate={validate} onSubmit={onSubmit} initialValues={initialValues}>
        <FormBody networks={networks} subnets={subnets} securityGroups={securityGroups} />

        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewPortForm
