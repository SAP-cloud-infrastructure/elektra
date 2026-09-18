import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import React from "react"

export default class NewShareNetworkForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = { show: true }
    this.close = this.close.bind(this)
    this.networkSubnets = this.networkSubnets.bind(this)
    this.renderForm = this.renderForm.bind(this)
    this.onValueChange = this.onValueChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  validate(values) {
    return (
      values.name && values.neutron_net_id && values.neutron_subnet_id && true
    )
  }

  close(e) {
    if (e) e.stopPropagation()
    this.setState({ show: false })
    setTimeout(() => this.props.history.replace("/share-networks"), 300)
  }

  componentDidMount() {
    this.props.loadNetworksOnce()
  }

  onValueChange(name, values) {
    if (name == "neutron_net_id") {
      this.props.loadSubnetsOnce(values[name])
    }
  }

  onSubmit(values) {
    let subnet = this.props.subnets[values.neutron_net_id].items.find(
      (i) => i.id == values.neutron_subnet_id
    )
    let newValues = Object.assign({}, values, { cidr: subnet.cidr })
    return this.props.handleSubmit(newValues).then(() => this.close())
  }

  networkSubnets(neutron_net_id) {
    if (this.props.subnets && neutron_net_id)
      return this.props.subnets[neutron_net_id]
  }

  renderForm({ values }) {
    let networkSubnets = this.networkSubnets(values.neutron_net_id)

    return (
      <>
        <Modal.Body>
          <Form.Errors />

          <Form.ElementHorizontal label="Name" name="name" required>
            <Form.Input elementType="input" type="text" name="name" />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal label="Description" name="description">
            <Form.Input
              elementType="textarea"
              className="text optional form-control"
              name="description"
            />
          </Form.ElementHorizontal>

          <Form.ElementHorizontal
            label="Neutron Net"
            required={true}
            name="neutron_net_id"
          >
            {this.props.networks.isFetching ? (
              <span className="spinner" />
            ) : (
              <Form.Input
                elementType="select"
                className="select required form-control"
                name="neutron_net_id"
              >
                <option></option>
                {this.props.networks.items.map((network, index) => (
                  <option value={network.id} key={network.id}>
                    {network.name}
                  </option>
                ))}
              </Form.Input>
            )}
          </Form.ElementHorizontal>

          {networkSubnets && (
            <Form.ElementHorizontal
              label="Neutron Subnet"
              required={true}
              name="cidr"
            >
              {networkSubnets.isFetching ? (
                <span className="spinner" />
              ) : (
                <Form.Input
                  elementType="select"
                  className="select required form-control"
                  name="neutron_subnet_id"
                >
                  <option></option>
                  {networkSubnets.items.map((subnet, index) => (
                    <option value={subnet.id} key={subnet.id}>
                      {subnet.name} {subnet.cidr}
                    </option>
                  ))}
                </Form.Input>
              )}
            </Form.ElementHorizontal>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Cancel</Button>
          <Form.SubmitButton label="Save" />
        </Modal.Footer>
      </>
    )
  }

  render() {
    const FormContent = this.renderForm
    return (
      <Modal
        backdrop="static"
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            New Share Network
          </Modal.Title>
        </Modal.Header>

        <Form
          validate={this.validate}
          onValueChange={this.onValueChange}
          initialValues={{}}
          className="form form-horizontal"
          onSubmit={this.onSubmit}
        >
          <FormContent />
        </Form>
      </Modal>
    )
  }
}
