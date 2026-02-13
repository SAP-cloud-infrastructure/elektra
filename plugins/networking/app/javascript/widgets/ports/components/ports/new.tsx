import React, { useState, useEffect, useMemo, useContext } from "react"
import { Modal, Button } from "react-bootstrap"
// @ts-expect-error - elektra-form has no types
import { Form } from "lib/elektra-form"
import ipRangeCheck from "ip-range-check"

// Types
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

interface NewPortFormProps {
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
  const context = useContext(Form.Context) as any
  const values = context.formValues || {}
  const networkSubnets: Subnet[] = useMemo(() => {
    if (!values.network_id || !subnets.items || subnets.items.length === 0) {
      return []
    }
    return subnets.items.filter((subnet) => subnet.network_id === values.network_id)
  }, [values.network_id, subnets.items])

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
              <option value={network.id} key={index}>
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

            {networkSubnets.map((subnet, index) => (
              <option value={subnet.id} key={index}>
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

  useEffect(() => {
    loadNetworksOnce()
    loadSubnetsOnce()
    loadSecurityGroupsOnce()
  }, [loadNetworksOnce, loadSubnetsOnce, loadSecurityGroupsOnce, networks, subnets, securityGroups])

  const validate = (values: any): boolean => {
    const subnet = subnets.items.find((s) => s.id === values.subnet_id)
    if (!subnet) return false

    return Boolean(
      values.network_id && values.subnet_id && values.ip_address && ipRangeCheck(values.ip_address, subnet.cidr)
    )
  }

  const close = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
    setTimeout(() => history.replace("/ports"), 300)
  }

  const onSubmit = (values: any) => {
    return handleSubmit(values).then(() => close())
  }

  const initialValues = useMemo(() => {
    if (!securityGroups || !securityGroups.items) {
      return null
    }
    const defaultOptions = securityGroups.items.filter((i) => i.name === "default").map((i) => i.id)

    return defaultOptions.length > 0 ? { security_groups: defaultOptions } : null
  }, [securityGroups])

  return (
    <Modal show={show} onHide={close} bsSize="large" aria-labelledby="contained-modal-title-lg">
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
