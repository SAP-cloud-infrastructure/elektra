import React, { useState, useEffect } from "react"
import { Button, Collapse } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { addNotice } from "lib/flashes"
import useLoadbalancer from "../../lib/hooks/useLoadbalancer"
import SelectInput from "../shared/SelectInput"
import TagsInput from "../shared/TagsInput"
import Log from "../shared/logger"
import { errorMessage } from "../../helpers/commonHelpers"
import {
  fetchAvailabilityZones,
  fetchPrivateNetworks,
  fetchSubnets,
} from "../../actions/loadbalancer"

const NewLoadbalancer = (props) => {
  const { createLoadbalancer } = useLoadbalancer()

  const [privateNetworks, setPrivateNetworks] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [subnets, setSubnets] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [availabilityZones, setAvailabilityZones] = useState({
    isLoading: false,
    error: null,
    items: [],
  })
  const [showAdvanceNetworkSettings, setShowAdvanceNetworkSettings] =
    useState(false)

  useEffect(() => {
    Log.debug("fetching private networks")
    setPrivateNetworks({ ...privateNetworks, isLoading: true })
    setAvailabilityZones({ ...privateNetworks, isLoading: true })
    fetchPrivateNetworks()
      .then((data) => {
        setPrivateNetworks({
          ...privateNetworks,
          isLoading: false,
          items: data.private_networks,
          error: null,
        })
      })
      .catch((error) => {
        setPrivateNetworks({
          ...privateNetworks,
          isLoading: false,
          error: errorMessage(error),
        })
      })
    fetchAvailabilityZones()
      .then((data) => {
        setAvailabilityZones({
          ...availabilityZones,
          isLoading: false,
          items: data.availability_zones,
          error: null,
        })
      })
      .catch((error) => {
        setAvailabilityZones({
          ...availabilityZones,
          isLoading: false,
          error: errorMessage(error),
        })
      })
  }, [])

  /*
   * Modal stuff
   */
  const [show, setShow] = useState(true)

  const close = (e) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const restoreUrl = () => {
    if (!show) {
      props.history.replace("/loadbalancers")
    }
  }

  /*
   * Form stuff
   */
  const [formErrors, setFormErrors] = useState(null)
  const [initialValues, setInitialValues] = useState({})

  const validate = ({
    name,
    description,
    vip_network_id,
    vip_subnet_id,
    vip_address,
    tags,
  }) => {
    return name && vip_network_id && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)
    const newValues = { ...values }

    // copy the subnet Id on every submit click if exists. No existing in values itself
    if (subnet) {
      newValues.vip_subnet_id = subnet.value
    }

    if (availabilityZone) {
      newValues.availability_zone = availabilityZone.value
    }

    // save the entered values in case of error
    setInitialValues(values)
    return createLoadbalancer(newValues)
      .then((data) => {
        addNotice(
          <>
            Loadbalancer <b>{data.name}</b> ({data.id}) is being created.
          </>
        )
        close()
      })
      .catch((error) => {
        setFormErrors(errorMessage(error))
      })
  }

  const [privateNetwork, setPrivateNetwork] = useState(null)
  const [subnet, setSubnet] = useState(null)
  const [availabilityZone, setAvailabilityZone] = useState(null)

  const onSelectPrivateNetworkChange = (props) => {
    if (props) {
      setPrivateNetwork(props)
      // reset selected subnet
      setSubnet(null)
      // set the new subnets
      setSubnets({ ...subnets, isLoading: true, error: null, items: [] })
      fetchSubnets(props.value)
        .then((data) => {
          // new subnets loaded
          setSubnets({
            ...subnets,
            isLoading: false,
            error: null,
            items: data.subnets,
          })
        })
        .catch((error) => {
          setSubnets({
            ...subnets,
            isLoading: false,
            error: errorMessage(error),
          })
        })
    }
  }
  const onSelectSubnetChange = (props) => {
    setSubnet(props)
  }

  const onSelectAvailibilityZone = (props) => {
    setAvailabilityZone(props)
  }

  const isAvailabilityZoneSelectDisabled =
    !availabilityZones.isLoading && availabilityZones.items.length == 0

  Log.debug("RENDER new loadbalancer")
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
        <Modal.Title id="contained-modal-title-lg">
          New Load Balancer
        </Modal.Title>
      </Modal.Header>

      <Form
        className="form form-horizontal"
        validate={validate}
        onSubmit={onSubmit}
        initialValues={initialValues}
        resetForm={false}
      >
        <Modal.Body>
          <p>
            The Load Balancer object defines the internal IP address under which
            all associated listeners can be reached. For external access a
            Floating IP can be attached to the Load Balancer.
          </p>
          <Form.Errors errors={formErrors} />
          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>
          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input elementType="input" type="text" name="description" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal
            label="Private Network"
            required
            name="vip_network_id"
          >
            <SelectInput
              name="vip_network_id"
              isLoading={privateNetworks.isLoading}
              items={privateNetworks.items}
              onChange={onSelectPrivateNetworkChange}
              value={privateNetwork}
            />
            {privateNetworks.error ? (
              <span className="text-danger">{privateNetworks.error}</span>
            ) : (
              ""
            )}
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The network which provides the internal IP of the load balancer.
            </span>
          </Form.ElementHorizontal>

          <Form.ElementHorizontal>
            <span className="pull-right">
              <Button
                bsStyle="link"
                onClick={() =>
                  setShowAdvanceNetworkSettings(!showAdvanceNetworkSettings)
                }
              >
                Toggle advanced network options
              </Button>
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showAdvanceNetworkSettings}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                <h5>Advanced Network Options</h5>
                <p>
                  These optional settings are for advanced usecases that require
                  more control over the network configuration of the new load
                  balancer.
                </p>

                <Form.ElementHorizontal
                  label="Availability zone"
                  name="availability_zone"
                >
                  <SelectInput
                    name="availability_zone"
                    isLoading={availabilityZones.isLoading}
                    items={availabilityZones.items}
                    onChange={onSelectAvailibilityZone}
                    value={availabilityZone}
                    conditionalPlaceholderText="Feature not available. There are no availability zones to select"
                    conditionalPlaceholderCondition={
                      isAvailabilityZoneSelectDisabled
                    }
                    isDisabled={isAvailabilityZoneSelectDisabled}
                    isClearable
                    useFormContext={false}
                    isOptionDisabled={(option) => !option.enabled}
                  />
                  {availabilityZones.error ? (
                    <span className="text-danger">
                      {availabilityZones.error}
                    </span>
                  ) : (
                    ""
                  )}
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    You may specify an availability zone (AZ). If left empty,
                    automatic cross-DC high availability will be used.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="Subnet" name="vip_subnet_id">
                  <SelectInput
                    name="vip_subnet_id"
                    isLoading={subnets.isLoading}
                    items={subnets.items}
                    onChange={onSelectSubnetChange}
                    value={subnet}
                    conditionalPlaceholderText="Please choose a network first"
                    conditionalPlaceholderCondition={privateNetwork == null}
                    isClearable
                    useFormContext={false}
                  />
                  {subnets.error ? (
                    <span className="text-danger">{subnets.error}</span>
                  ) : (
                    ""
                  )}
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    You can specify a subnet from which the fixed IP is chosen.
                    If empty any subnet is selected.
                  </span>
                </Form.ElementHorizontal>

                <Form.ElementHorizontal label="IP Address" name="vip_address">
                  <Form.Input
                    elementType="input"
                    type="text"
                    name="vip_address"
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    You can specify an IP from the subnet if you like. Otherwise
                    an IP will be allocated automatically.
                  </span>
                </Form.ElementHorizontal>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal label="Tags" name="tags">
            <TagsInput name="tags" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              Start a new tag typing a string and hitting the Enter or Tab key.
            </span>
          </Form.ElementHorizontal>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NewLoadbalancer
