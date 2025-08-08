import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import {
  SECURITY_GROUP_RULE_DESCRIPTIONS,
  SECURITY_GROUP_RULE_PREDEFINED_TYPES,
  SECURITY_GROUP_RULE_PROTOCOLS,
} from "../../constants"
import { useContext } from "react"
import React from "react"

const FormBody = ({ values, securityGroups }) => {
  const context = useContext(Form.Context)

  const changeType = (type) => {
    const predefinedType = SECURITY_GROUP_RULE_PREDEFINED_TYPES.find(
      (t) => t.label == type
    )

    if (predefinedType) {
      context.onChange({
        protocol: predefinedType.protocol,
        port_range: predefinedType.portRange,
        direction: predefinedType.direction || values.direction,
        type,
      })
    } else context.onChange("type", type)
  }

  const updateAndResetType = (name, value) => {
    context.onChange({ [name]: value, type: null })
  }

  return (
    <Modal.Body>
      <div className="row">
        <div className="col-sm-6">
          <Form.Errors />

          <Form.ElementInline label="Type" name="type">
            <Form.Input
              elementType="select"
              className="select form-control"
              name="type"
              onChange={(e) => changeType(e.target.value)}
            >
              <option></option>
              {SECURITY_GROUP_RULE_PREDEFINED_TYPES.map((type, index) => (
                <option value={type.label} key={index}>
                  {type.label}
                </option>
              ))}
            </Form.Input>
          </Form.ElementInline>

          <Form.ElementInline label="Protocol" name="protocol">
            <Form.Input
              elementType="select"
              className="select form-control"
              name="protocol"
              onChange={(e) => updateAndResetType("protocol", e.target.value)}
            >
              <option></option>
              {SECURITY_GROUP_RULE_PROTOCOLS.map((proto, index) => (
                <option value={proto.key} key={index}>
                  {proto.label}
                </option>
              ))}
            </Form.Input>
          </Form.ElementInline>

          <Form.ElementInline label="Direction" name="direction" required>
            <Form.Input
              elementType="select"
              className="select required form-control"
              name="direction"
              onChange={(e) => updateAndResetType("direction", e.target.value)}
            >
              <option value="ingress">Ingress</option>
              <option value="egress">Egress</option>
            </Form.Input>
          </Form.ElementInline>

          {values.protocol == "icmp" ? (
            <>
              <Form.ElementInline label="ICMP Type" name="icmp_type">
                <Form.Input elementType="input" type="text" name="icmp_type" />
                <p className="help-block">
                  ICMP Type is a number between 0 and 255
                </p>
              </Form.ElementInline>

              <Form.ElementInline label="ICMP Code" name="icmp_code">
                <Form.Input elementType="input" type="text" name="icmp_code" />
                <p className="help-block">
                  ICMP Code is a number between 0 and 15
                </p>
              </Form.ElementInline>
            </>
          ) : (
            <Form.ElementInline label="Port Range" name="port_range">
              <Form.Input elementType="input" type="text" name="port_range" />
              <p className="help-block">
                Example for range 1-80 and single port 80
              </p>
            </Form.ElementInline>
          )}
          <Form.ElementInline
            label="Remote Source"
            name="remote_source"
            required
          >
            <Form.Input
              elementType="select"
              className="select required form-control"
              name="remote_source"
            >
              <option value="ip">IP Address</option>
              <option value="group">Security Group</option>
            </Form.Input>
          </Form.ElementInline>

          {values.remote_source == "group" ? (
            <Form.ElementInline
              label="Remote Source"
              name="remote_group_id"
              required
            >
              {!securityGroups || securityGroups.isFetching ? (
                <span className="spinner" />
              ) : (
                <>
                  <Form.Input
                    elementType="select"
                    className="select required form-control"
                    name="remote_group_id"
                  >
                    <option></option>
                    {securityGroups.items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Form.Input>
                  <p className="text-danger">
                    This should only be used if you operate within the
                    documented boundaries. Please review the&nbsp;
                    <a
                      href="https://documentation.global.cloud.sap/docs/customer/networking/security-groups/network-secgroup-design/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      best practice for security group design
                    </a>
                  </p>
                </>
              )}
            </Form.ElementInline>
          ) : (
            <>
              <Form.ElementInline
                label="IP Address"
                name="remote_ip_prefix"
                required
              >
                <Form.Input
                  elementType="input"
                  type="text"
                  name="remote_ip_prefix"
                  placeholder="0.0.0.0/0"
                />
                <p className="help-block">
                  Example for IPv4 0.0.0.0/0 and IPv6 ::/0
                </p>
              </Form.ElementInline>

              <Form.ElementInline label="Ether Type" name="ethertype">
                <Form.Input
                  elementType="select"
                  className="select form-control"
                  name="ethertype"
                >
                  <option value="ipv4">IPv4</option>
                  <option value="ipv6">IPv6</option>
                </Form.Input>
              </Form.ElementInline>
            </>
          )}

          <Form.ElementInline label="Description" name="description">
            <Form.Input
              elementType="textarea"
              className="text optional form-control"
              name="description"
            />
          </Form.ElementInline>
        </div>

        <div className="col-sm-6">
          <div className="bs-callout bs-callout-primary small">
            {SECURITY_GROUP_RULE_DESCRIPTIONS.map((description, index) =>
              (values.protocol == "icmp" && description.key == "portRange") ||
              (values.protocol != "icmp" &&
                description.key == "icmp") ? null : (
                <React.Fragment key={index}>
                  {description.title != "Rules" && <h4>{description.title}</h4>}
                  <p>{description.text}</p>
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </div>
    </Modal.Body>
  )
}

export default class NewRuleForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    if (!this.props.securityGroup) {
      this.props
        .loadSecurityGroup()
        .catch((loadError) => this.setState({ loadError }))
    }
  }

  validate = (values) => {
    return (
      values.direction &&
      ((values.remote_source == "group" && values.remote_group_id) ||
        (values.remote_source == "ip" && values.remote_ip_prefix)) &&
      true
    )
  }

  close = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  restoreUrl = (e) => {
    if (!this.state.show)
      this.props.history.replace(
        `/security-groups/${this.props.securityGroupId}/rules`
      )
  }

  onSubmit = (values) => {
    let parsedValues = {
      direction: values.direction,
      protocol: values.protocol,
      description: values.description,
    }

    if (values.protocol == "icmp") {
      parsedValues["port_range_min"] = values.icmp_type
      parsedValues["port_range_max"] = values.icmp_code
    } else if (values.port_range) {
      const range = values.port_range.toString().split("-")
      if (range.length > 0) {
        parsedValues["port_range_min"] = range[0]
        parsedValues["port_range_max"] = range[0]
      }
      if (range.length > 1) parsedValues["port_range_max"] = range[1]
    }

    if (values.remote_source == "group") {
      parsedValues["remote_group_id"] = values.remote_group_id
    } else if (values.remote_source == "ip") {
      parsedValues["remote_ip_prefix"] = values.remote_ip_prefix
      parsedValues["ethertype"] = values.ethertype
    }

    // console.log('values',values)
    // console.log('parsedValues',parsedValues)
    return this.props.handleSubmit(parsedValues).then(() => this.close())
  }

  render() {
    const initialValues = {
      direction: "ingress",
      remote_ip_prefix: "0.0.0.0/0",
      ethertype: "ipv4",
      remote_source: "ip",
    }

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        dialogClassName="modal-xl"
        backdrop="static"
        onExited={this.restoreUrl}
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            New Security Group Rule
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          <FormBody securityGroups={this.props.securityGroups} />

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Save" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
