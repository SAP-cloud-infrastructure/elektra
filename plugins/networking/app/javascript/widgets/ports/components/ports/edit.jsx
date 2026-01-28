import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import React from "react"
// import PropTypes from 'prop-types';

const FormBody = ({ values, networks, subnets, securityGroups }) => {
  const network =
    networks && networks.items.find((n) => n.id == values.network_id)

  const renderIp = (ip) => {
    let subnet = subnets && subnets.items.find((i) => i.id == ip.subnet_id)
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
        {values.fixed_ips &&
          values.fixed_ips.map((ip, index) => (
            <div key={index} className="form-control-static">
              {renderIp(ip)}
            </div>
          ))}
      </Form.ElementHorizontal>

      {securityGroups &&
        securityGroups.items &&
        securityGroups.items.length > 0 && (
          <Form.ElementHorizontal
            label="Security Groups"
            name="security_groups"
          >
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
        <Form.Input
          elementType="textarea"
          className="text optional form-control"
          name="description"
        />
      </Form.ElementHorizontal>
    </Modal.Body>
  )
}

export default class NewPortForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    this.loadDependencies(this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.loadDependencies(nextProps)
  }

  loadDependencies(props) {
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }

  validate = (values) => {
    return true
  }

  close = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/ports"), 300)
  }

  onSubmit = (values) => {
    return this.props.handleSubmit(values).then(() => this.close())
  }

  render() {
    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Edit Port{" "}
            {this.props.port &&
              `${this.props.port.name} (${this.props.port.id})`}
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={this.props.port}
        >
          {!this.props.port ? (
            <Modal.Body>
              <span className="spinner"></span> Loading ...
            </Modal.Body>
          ) : (
            <FormBody
              networks={this.props.networks}
              subnets={this.props.subnets}
              securityGroups={this.props.securityGroups}
            />
          )}

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Save" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
