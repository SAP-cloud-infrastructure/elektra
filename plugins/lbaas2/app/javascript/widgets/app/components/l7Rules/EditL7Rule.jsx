import React, { useState, useEffect } from "react"
import { Button, Collapse } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import useL7Rule from "../../lib/hooks/useL7Rule"
import ErrorPage from "../ErrorPage"
import HelpPopover from "../shared/HelpPopover"
import SelectInput from "../shared/SelectInput"
import TagsInput from "../shared/TagsInput"
import useL7Policy from "../../lib/hooks/useL7Policy"
import { addNotice } from "lib/flashes"
import Log from "../shared/logger"
import {
  helpBlockTextForSelect,
  formErrorMessage,
  matchParams,
  searchParamsToString,
} from "../../helpers/commonHelpers"
import { fetchL7Rule } from "../../actions/l7Rule"
import {
  ruleTypes,
  ruleTypeKeyRelation,
  ruleCompareTypes,
} from "../../helpers/l7RuleHelpers"

const EditL7Rule = (props) => {
  const { updateL7Rule } = useL7Rule()
  const { persistL7Policy } = useL7Policy()
  const [loadbalancerID, setLoadbalancerID] = useState(null)
  const [listenerID, setListenerID] = useState(null)
  const [l7policyID, setL7policyID] = useState(null)
  const [l7ruleID, setl7ruleID] = useState(null)

  const [l7rule, setL7rule] = useState({
    isLoading: false,
    error: null,
    item: null,
  })
  const [showKeyAttribute, setShowKeyAttribute] = useState(false)
  const [ruleType, setRuleType] = useState(null)
  const [ruleCompareType, setRuleCompareType] = useState(null)
  const [usedRegexComparedType, setUsedRegexComparedType] = useState(false)

  useEffect(() => {
    // get the lb
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const ltID = params.listenerID
    const l7pID = params.l7policyID
    const l7rID = params.l7ruleID
    setLoadbalancerID(lbID)
    setListenerID(ltID)
    setL7policyID(l7pID)
    setl7ruleID(l7rID)
  }, [])

  useEffect(() => {
    if (l7ruleID) {
      loadL7rule()
    }
  }, [l7ruleID])

  const loadL7rule = () => {
    Log.debug("fetching l7rule to edit")
    setL7rule({ ...l7rule, isLoading: true, error: null })
    fetchL7Rule(loadbalancerID, listenerID, l7policyID, l7ruleID)
      .then((data) => {
        setL7rule({
          ...l7rule,
          isLoading: false,
          item: data.l7rule,
          error: null,
        })
      })
      .catch((error) => {
        setL7rule({ ...l7rule, isLoading: false, error: error })
      })
  }

  useEffect(() => {
    if (l7rule.item) {
      setSelectType()
      setSelectCompareType()
    }
  }, [l7rule.item])

  const setSelectType = () => {
    const selectedOption = ruleTypes().find(
      (i) => i.value == (l7rule.item.type || "").trim()
    )
    onSelectType(selectedOption)
  }

  const setSelectCompareType = () => {
    if (l7rule.item.compare_type === "REGEX") {
      setUsedRegexComparedType(true)
    }
    const selectedOption = ruleCompareTypes().find(
      (i) => i.value == (l7rule.item.compare_type || "").trim()
    )
    onSelectCompareType(selectedOption)
  }

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
      props.history.replace(
        `/loadbalancers/${loadbalancerID}/show?${searchParamsToString(props)}`
      )
    }
  }

  /**
   * Form stuff
   */
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

    // if the compare type wasn't changed after editing, this will removed so the user is force to change it.
    if (newValues.compare_type === "REGEX") {
      delete newValues.compare_type
    }

    return updateL7Rule(
      loadbalancerID,
      listenerID,
      l7policyID,
      l7ruleID,
      newValues
    )
      .then((data) => {
        addNotice(
          <>
            L7 Rule <b>{data.type}</b> ({data.id}) is being updated.
          </>
        )
        // fetch the policy again containing the new l7rule
        persistL7Policy(loadbalancerID, listenerID, l7policyID).catch(
          (error) => {}
        )
        close()
      })
      .catch((error) => {
        setFormErrors(formErrorMessage(error))
      })
  }

  const onSelectType = (option) => {
    setRuleType(option)
    setShowKeyAttribute(ruleTypeKeyRelation(option.value))
  }

  const onSelectCompareType = (option) => {
    setUsedRegexComparedType(false)
    setRuleCompareType(option)
  }

  Log.debug("RENDER edit L7 Rule")
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
        <Modal.Title id="contained-modal-title-lg">Edit L7 Rule</Modal.Title>
      </Modal.Header>

      {l7rule.error ? (
        <Modal.Body>
          <ErrorPage
            headTitle="Edit L7 Rule"
            error={l7rule.error}
            onReload={loadL7rule}
          />
        </Modal.Body>
      ) : (
        <>
          {l7rule.isLoading ? (
            <Modal.Body>
              <span className="spinner" />
            </Modal.Body>
          ) : (
            <Form
              className="form form-horizontal"
              validate={validate}
              onSubmit={onSubmit}
              initialValues={l7rule.item}
              resetForm={false}
            >
              <Modal.Body>
                <p>
                  Layer 7 rules are individual statements of logic which match
                  parts of an HTTP request, session, or other protocol-specific
                  data for any given client request. All the layer 7 rules
                  associated with a given layer 7 policy are logically ANDed
                  together to see whether the policy matches a given client
                  request.
                </p>
                <Form.Errors errors={formErrors} />
                <Form.ElementHorizontal label="Type" name="type" required>
                  <SelectInput
                    name="type"
                    items={ruleTypes()}
                    onChange={onSelectType}
                    value={ruleType}
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
                    value={ruleCompareType}
                  />
                  {usedRegexComparedType ? (
                    <span className="text-danger">
                      {
                        "Compare type 'REGEX' is not supported. Please choose a different one. "
                      }
                    </span>
                  ) : (
                    ""
                  )}
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    <span className="help-block-text">
                      The L7 rule compare type. See help for more information.
                    </span>
                    <HelpPopover
                      text={helpBlockTextForSelect(ruleCompareTypes())}
                    />
                  </span>
                </Form.ElementHorizontal>
                <Form.ElementHorizontal
                  label="Inverse Comparisation (NOT)"
                  name="invert"
                >
                  <Form.Input
                    elementType="input"
                    type="checkbox"
                    name="invert"
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    When true the logic of the rule is inverted. For example,
                    with invert true, equal to would become not equal to.
                    Default is false.
                  </span>
                </Form.ElementHorizontal>

                <Collapse in={showKeyAttribute}>
                  <div className="advanced-options-section">
                    <div className="advanced-options">
                      <Form.ElementHorizontal label="Key" name="key" required>
                        <Form.Input
                          elementType="input"
                          type="text"
                          name="key"
                        />
                        <span className="help-block">
                          <i className="fa fa-info-circle"></i>
                          The key to use for the comparison. For example, the
                          name of the cookie to evaluate.
                        </span>
                      </Form.ElementHorizontal>
                    </div>
                  </div>
                </Collapse>

                <Form.ElementHorizontal label="Value" name="value" required>
                  <Form.Input elementType="input" type="text" name="value" />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    The value to use for the comparison. For example, the file
                    type to compare.
                  </span>
                </Form.ElementHorizontal>
                <Form.ElementHorizontal label="Tags" name="tags">
                  <TagsInput
                    name="tags"
                    initValue={l7rule.item && l7rule.item.tags}
                  />
                  <span className="help-block">
                    <i className="fa fa-info-circle"></i>
                    Start a new tag typing a string and hitting the Enter or Tab
                    key.
                  </span>
                </Form.ElementHorizontal>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={close}>Cancel</Button>
                <Form.SubmitButton label="Save" />
              </Modal.Footer>
            </Form>
          )}
        </>
      )}
    </Modal>
  )
}

export default EditL7Rule
