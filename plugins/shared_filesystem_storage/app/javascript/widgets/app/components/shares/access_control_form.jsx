import { Form } from "lib/elektra-form"
import React from "react"

const AccessControlForm = (props) => {
  let accessTypes = {}
  if (props.share.share_proto == "NFS") accessTypes["ip"] = "ip"
  else if (props.share.share_proto == "CIFS") accessTypes["user"] = "user"
  else if (props.share.share_proto == "MULTI")
    accessTypes = { ip: "ip", user: "user" }
  const accessLevels = { ro: "read-only", rw: "read-write" }

  const accessToPlaceholder = () => {
    switch (props.values.access_type) {
      case "ip":
        return "IP address"
      case "user":
        return "User or group name"
      case "cert":
        return "TLS certificate"
      default:
        return "Access to"
    }
  }

  const accessToInfo = () => {
    switch (props.values.access_type) {
      case "ip":
        return "A valid format is XX.XX.XX.XX or XX.XX.XX.XX/XX. For example 0.0.0.0/0."
      case "user":
        return "A valid value is an alphanumeric string that can contain some special characters and is from 4 to 32 characters long."
      case "cert":
        return "Specify the TLS identity as the IDENTKEY. A valid value is any string up to 64 characters long in the common name (CN) of the certificate. The meaning of a string depends on its interpretation. "
      default:
        return null
    }
  }

  return (
    <>
      {props.shareNetwork && <div>{`Network: ${props.shareNetwork.cidr}`}</div>}
      <Form.Errors />

      <Form.ElementInline
        label="Access Type"
        name="access_type"
        labelClass="visually-hidden"
      >
        <Form.Input elementType="select" name="access_type">
          <option value="">Select Access Type</option>
          {Object.keys(accessTypes).map((accessType, index) => (
            <option value={accessType} key={accessType}>
              {accessTypes[accessType]}
            </option>
          ))}
        </Form.Input>
      </Form.ElementInline>

      <Form.ElementInline
        label="Access To"
        name="access_to"
        labelClass="visually-hidden"
      >
        <Form.Input
          elementType="input"
          type="test"
          name="access_to"
          placeholder={accessToPlaceholder()}
        />
      </Form.ElementInline>

      <Form.ElementInline
        label="Access Level"
        name="access_level"
        labelClass="visually-hidden"
      >
        <Form.Input elementType="select" name="access_level">
          <option value="">Select Access Level</option>
          {Object.keys(accessLevels).map((accessLevel, index) => (
            <option value={accessLevel} key={accessLevel}>
              {accessLevels[accessLevel]}
            </option>
          ))}
        </Form.Input>
      </Form.ElementInline>

      <div className="form-group">
        <Form.SubmitButton label="Save" />
      </div>
      {accessToInfo() && (
        <p className="help-block">
          <i className="fa fa-info-circle" />
          {accessToInfo()}
        </p>
      )}
    </>
  )
}

const AccessControlFormWrapper = ({ share, shareNetwork, handleSubmit }) => {
  const validate = (values) => {
    return values.access_type && values.access_level && values.access_to && true
  }

  return (
    <Form
      validate={validate}
      className="form form-inline"
      onSubmit={handleSubmit}
    >
      <AccessControlForm share={share} shareNetwork={shareNetwork} />
    </Form>
  )
}

export default AccessControlFormWrapper
