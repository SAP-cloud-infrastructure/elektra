import React, { useState } from "react"
import { Button, Collapse } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import HelpPopover from "../shared/HelpPopover"
import SelectInput from "../shared/SelectInput"
import useL7Rule from "../../lib/hooks/useL7Rule"
import TagsInput from "../shared/TagsInput"
import useL7Policy from "../../lib/hooks/useL7Policy"
import { addNotice } from "lib/flashes"
import {
  helpBlockTextForSelect,
  formErrorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import {
  ruleTypes,
  ruleTypeKeyRelation,
  ruleCompareTypes,
} from "../../helpers/l7RuleHelpers"

const NewL7Rule = (props) => {
  const { createL7Rule } = useL7Rule()
  const { persistL7Policy } = useL7Policy()
  const [showKeyAttribute, setShowKeyAttribute] = useState(false)

  /**
   * Modal stuff
   */
  const [show, setShow] = useState(true)

  const close = (e) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const restoreUrl = () => {
    if (!show) {
      const params = matchParams(props)
      const lbID = params.loadbalancerID
      props.history.replace(
        `/loadbalancers/${lbID}/show?${searchParamsToString(props)}`
      )
    }
  }

  /**
   * Form stuff
   */
  const [initialValues, setInitialValues] = useState({})
  const [formErrors, setFormErrors] = useState(null)

  const validate = ({ type, compare_type, value, key, invert, tags }) => {
    return type && compare_type && value && true
  }

  const onSubmit = (values) => {
    setFormErrors(null)

    const newValues = { ...values }
    // remove key if the type was changed from header or cookie to another type
    if (!ruleTypeKeyRelation(newValues.type)) {
      delete newValues.key
    }

    // save the entered values in case of error
    setInitialValues(newValues)
    // collect lb and listener id
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const listenerID = params.listenerID
    const l7policyID = params.l7policyID
    return createL7Rule(lbID, listenerID, l7policyID, values)
      .then((data) => {
        addNotice(
          <>
            L7 Rule <b>{data.type}</b> ({data.id}) is being created.
          </>
        )
        // fetch the policy again containing the new l7rule
        persistL7Policy(lbID, listenerID, l7policyID)
          .then(() => {})
          .catch((error) => {})
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onSelectType = (option) => {
    setShowKeyAttribute(ruleTypeKeyRelation(option.value))
  }

  const onSelectCompareType = () => {}

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
        <Modal.Title id="contained-modal-title-lg">New L7 Rule</Modal.Title>
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
            Layer 7 rules are individual statements of logic which match parts
            of an HTTP request, session, or other protocol-specific data for any
            given client request. All the layer 7 rules associated with a given
            layer 7 policy are logically ANDed together to see whether the
            policy matches a given client request.
          </p>
          <Form.Errors errors={formErrors} />
          <Form.ElementHorizontal label="Type" name="type" required>
            <SelectInput
              name="type"
              items={ruleTypes()}
              onChange={onSelectType}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              <span className="help-block-text">
                The L7 rule type. See help for more information.
              </span>
              <HelpPopover text={helpBlockTextForSelect(ruleTypes())} />
            </span>
          </Form.ElementHorizontal>
          <Form.ElementHorizontal
            label="Compare Type"
            name="compare_type"
            required
          >
            <SelectInput
              name="compare_type"
              items={ruleCompareTypes()}
              onChange={onSelectCompareType}
            />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              <span className="help-block-text">
                The L7 rule compare type. See help for more information.
              </span>
              <HelpPopover text={helpBlockTextForSelect(ruleCompareTypes())} />
            </span>
          </Form.ElementHorizontal>
          <Form.ElementHorizontal
            label="Inverse Comparisation (NOT)"
            name="invert"
          >
            <Form.Input elementType="input" type="checkbox" name="invert" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              When true the logic of the rule is inverted. For example, with
              invert true, equal to would become not equal to. Default is false.
            </span>
          </Form.ElementHorizontal>

          <Collapse in={showKeyAttribute}>
            <div className="advanced-options-section">
              <div className="advanced-options">
                <Form.ElementHorizontal label="Key" name="key" required>
                  <Form.Input elementType="input" type="text" name="key" />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The key to use for the comparison. For example, the name of
                    the cookie to evaluate.
                  </span>
                </Form.ElementHorizontal>
              </div>
            </div>
          </Collapse>

          <Form.ElementHorizontal label="Value" name="value" required>
            <Form.Input elementType="input" type="text" name="value" />
            <span className="help-block">
              <i className="fa fa-info-circle"></i>
              The value to use for the comparison. For example, the file type to
              compare.
            </span>
          </Form.ElementHorizontal>
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

export default NewL7Rule
