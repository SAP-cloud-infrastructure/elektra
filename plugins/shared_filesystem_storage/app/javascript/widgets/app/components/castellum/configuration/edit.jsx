import { useContext } from "react"
import { Modal, Button } from "react-bootstrap"
import { Form } from "lib/elektra-form"
import React from "react"

//This needs to be a separate component because we can only access the
//Form.Context from inside the Form.
const FormBody = ({ close, errors }) => {
  const values = useContext(Form.Context).formValues

  let validationError = ""
  switch (true) {
    case values.low_enabled == "false" && values.high_enabled == "false" && values.critical_enabled == "false":
      validationError = "To use autoscaling, at least one threshold must be enabled."
      break
    case values.size_maximum == "":
      validationError = "Please set the maximum size for extensions."
      break
    default:
      break
  }

  return (
    <>
      <Modal.Body>
        <Form.Errors errors={errors} />

        <Form.ElementHorizontal label="When usage is low:" name="low_enabled" labelWidth={5}>
          <Form.Input elementType="select">
            <option value="false">Do nothing</option>
            <option value="true">Auto-shrink share</option>
          </Form.Input>
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Must observe low usage for (minutes):"
          name="low_delay"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" min="5" disabled={values.low_enabled == "false"} />
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Usage is low below (%):"
          name="low_usage"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" min="0" max="100" disabled={values.low_enabled == "false"} />
        </Form.ElementHorizontal>

        <Form.ElementHorizontal label="When usage is high:" name="high_enabled" labelWidth={5}>
          <Form.Input elementType="select">
            <option value="false">Do nothing</option>
            <option value="true">Auto-extend share</option>
          </Form.Input>
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Must observe high usage for (minutes):"
          name="high_delay"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" min="5" disabled={values.high_enabled == "false"} />
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Usage is high above (%):"
          name="high_usage"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" min="0" max="100" disabled={values.high_enabled == "false"} />
        </Form.ElementHorizontal>

        <Form.ElementHorizontal label="When usage is critical:" name="critical_enabled" labelWidth={5}>
          <Form.Input elementType="select">
            <option value="false">Do nothing</option>
            <option value="true">Auto-extend share immediately</option>
          </Form.Input>
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Usage is critical above (%):"
          name="critical_usage"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input
            elementType="input"
            type="number"
            min="0"
            max="100"
            disabled={values.critical_enabled == "false"}
          />
        </Form.ElementHorizontal>

        <Form.ElementHorizontal label="Stepping strategy:" name="size_step_single" labelWidth={5}>
          <Form.Input elementType="select">
            <option value="false">Percentage-step resizing</option>
            <option value="true">Single-step resizing</option>
          </Form.Input>
          <p className="help-block" style={{ marginBottom: 0 }}>
            <i className="fa fa-info-circle" />
            The different choices are explained in{" "}
            <a
              href="https://github.com/sapcc/castellum/blob/master/docs/api-spec.md#stepping-strategies"
              target="_blank"
              rel="noreferrer"
            >
              this section
            </a>{" "}
            of the autoscaler documentation.
          </p>
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Each resize extends/shrinks by (%):"
          name="size_step_percent"
          labelWidth={5}
          required={values.size_step_single == "false"}
          labelClass="control-label secondary-label"
        >
          <Form.Input
            elementType="input"
            type="number"
            min="1"
            max="100"
            disabled={values.size_step_single == "true"}
          />
          <p className="help-block" style={{ marginBottom: 0 }}>
            <i className="fa fa-info-circle" />
            As an exception, multiple steps can be taken at once to resolve a critical usage level.
          </p>
        </Form.ElementHorizontal>

        <Form.ElementHorizontal
          label="Never shrink to a total size below (GiB):"
          name="size_minimum"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" min="0" />
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Never extend to a total size above (GiB):"
          name="size_maximum"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" required={true} min="0" />
        </Form.ElementHorizontal>
        <Form.ElementHorizontal
          label="Ensure this much free space (GiB):"
          name="free_minimum"
          labelWidth={5}
          labelClass="control-label secondary-label"
        >
          <Form.Input elementType="input" type="number" min="0" />
          <div className="checkbox">
            <label>
              <Form.Input
                elementType="input"
                type="checkbox"
                name="minimum_free_is_critical"
                disabled={values.free_minimum == ""}
              />
              <span>When crossing this threshold, resize without delay</span>
            </label>
          </div>
        </Form.ElementHorizontal>
      </Modal.Body>
      <Modal.Footer>
        <span className="not-valid-explanation">{validationError}</span>
        <Form.SubmitButton label="Save" />
        <Button onClick={close}>Cancel</Button>
      </Modal.Footer>
    </>
  )
}

export default class CastellumConfigurationEditModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = { show: true, apiErrors: null }
    this.close = this.close.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.validate = this.validate.bind(this)
  }

  getInitialValues() {
    const { shareType } = this.props.match.params
    console.log("PROPSEDIT", this.props, shareType)
    const { data: config, isFetching, receivedAt } = this.props.config
    
    if (isFetching || receivedAt == null) {
      //wait until config was loaded
      return null
    }
    const data = config[shareType]

    const cfg = data || {}
    const sec2min = (seconds) => Math.round(seconds / 60)
    return {
      //'true' and 'false' are strings here because form values are stringly typed anyway
      low_enabled: cfg.low_threshold ? "true" : "false",
      low_usage: (cfg.low_threshold || {}).usage_percent || 50,
      low_delay: sec2min((cfg.low_threshold || {}).delay_seconds || 10800),
      high_enabled: cfg.high_threshold ? "true" : "false",
      high_usage: (cfg.high_threshold || {}).usage_percent || 80,
      high_delay: sec2min((cfg.high_threshold || {}).delay_seconds || 3600),
      critical_enabled: cfg.critical_threshold ? "true" : "false",
      critical_usage: (cfg.critical_threshold || {}).usage_percent || 95,
      size_step_single: (cfg.size_steps || {}).single ? "true" : "false",
      size_step_percent: (cfg.size_steps || {}).percent || 10,
      size_minimum: (cfg.size_constraints || {}).minimum || "",
      size_maximum: (cfg.size_constraints || {}).maximum || "",
      free_minimum: (cfg.size_constraints || {}).minimum_free || "",
      minimum_free_is_critical: (cfg.size_constraints || {}).minimum_free_is_critical || false,
    }
  }

  close(e) {
    if (e) {
      e.stopPropagation()
    }
    this.setState({ ...this.state, show: false })
    setTimeout(() => this.props.history.replace("/autoscaling"), 300)
  }

  validate(values) {
    return (
      (values.low_enabled == "true" || values.high_enabled == "true" || values.critical_enabled == "true") &&
      (values.size_step_single == "true" || values.size_step_percent != "") &&
      values.size_maximum != ""
    )
  }

  onSubmit(values) {
    //convert the flat `values` back into the JSON format expected by the Castellum API
    const config = {}
    if (values.size_step_single == "true") {
      config.size_steps = { single: true }
    } else {
      config.size_steps = { percent: parseInt(values.size_step_percent, 10) }
    }
    if (values.low_enabled == "true") {
      config.low_threshold = {
        usage_percent: parseInt(values.low_usage, 10),
        delay_seconds: parseInt(values.low_delay, 10) * 60,
      }
    }
    if (values.high_enabled == "true") {
      config.high_threshold = {
        usage_percent: parseInt(values.high_usage, 10),
        delay_seconds: parseInt(values.high_delay, 10) * 60,
      }
    }
    if (values.critical_enabled == "true") {
      config.critical_threshold = {
        usage_percent: parseInt(values.critical_usage, 10),
      }
    }
    if (values.size_minimum != "") {
      config.size_constraints = config.size_constraints || {}
      config.size_constraints.minimum = parseInt(values.size_minimum, 10)
    }
    if (values.size_maximum != "") {
      config.size_constraints = config.size_constraints || {}
      config.size_constraints.maximum = parseInt(values.size_maximum, 10)
    }
    if (values.free_minimum != "") {
      config.size_constraints = config.size_constraints || {}
      config.size_constraints.minimum_free = parseInt(values.free_minimum, 10)
    }
    if (values.free_minimum != "" && values.minimum_free_is_critical) {
      config.size_constraints = config.size_constraints || {}
      config.size_constraints.minimum_free_is_critical = true
    }

    const { shareType } = this.props.match.params
    this.props
      .configureAutoscaling(this.props.projectID, shareType, config)
      .then(this.close)
      .catch((e) => this.setState({ ...this.state, apiErrors: e }))
  }

  render() {
    const initialValues = this.getInitialValues()
    if (initialValues == null) {
      //cannot show <Form/> before config is loaded, otherwise it would
      //initialize itself with empty inputs everywhere
      return null
    }

    //NOTE: className on Modal ensures that plugin-specific CSS rules get applied
    return (
      <Modal
        backdrop="static"
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
        className="shared_filesystem_storage"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">Configure Autoscaling</Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          <FormBody close={this.close} errors={this.state.apiErrors} />
        </Form>
      </Modal>
    )
  }
}
