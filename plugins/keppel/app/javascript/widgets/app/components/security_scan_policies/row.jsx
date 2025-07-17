import React from "react"
import { MoveOperation } from "../modalHelpers/moveOperation"
import { validatePolicy } from "./utils"
import { makeSelectBox, makeTextInput } from "../utils"

const repoFilterOptions = [
  { value: "off", label: "for all repositories" },
  { value: "on", label: "for repositories matching..." },
]
const vulnIDFilterOptions = [
  { value: "off", label: "for all vulnerability IDs" },
  { value: "on", label: "for vulnerability IDs matching..." },
]
const severityOptions = [
  { value: "Ignore", label: "Ignore" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
]

const SecurityScanPoliciesEditRow = ({
  index,
  policy,
  policyCount,
  isEditable,
  movePolicy,
  setPolicyAttribute,
  removePolicy,
}) => {
  const validationError = validatePolicy(policy)

  return (
    <tr data-testid={`policy:${index + 1}`}>
      {isEditable ? (
        <td key="order" className="policy-order-buttons">
          <MoveOperation index={index} itemCount={policyCount} onMove={movePolicy} />
        </td>
      ) : (
        <td key="order" className="policy-order-buttons"></td>
      )}
      <td>
        {makeSelectBox({
          testID: "severityBox",
          isEditable,
          options: severityOptions,
          value: policy.ui_hints.severity,
          onChange: (e) => setPolicyAttribute(index, "severity", e.target.value),
        })}
      </td>
      <td className="form-inline">
        <div className="policy-matching-rule-line">
          {makeSelectBox({
            isEditable,
            options: repoFilterOptions,
            value: policy.ui_hints.repo_filter,
            onChange: (e) => setPolicyAttribute(index, "repo_filter", e.target.value),
          })}
          {policy.ui_hints.repo_filter === "on" && (
            <>
              {" regex "}
              {makeTextInput({
                value: policy.match_repository,
                isEditable,
                onChange: (e) => {
                  setPolicyAttribute(index, "match_repository", e.target.value)
                },
              })}
              {(isEditable || policy.except_repository) && (
                <>
                  {" but not regex "}
                  {makeTextInput({
                    value: policy.except_repository,
                    isEditable,
                    onChange: (e) => {
                      setPolicyAttribute(index, "except_repository", e.target.value)
                    },
                  })}
                </>
              )}
            </>
          )}
        </div>
        <div className="policy-matching-rule-line">
          {makeSelectBox({
            isEditable,
            options: vulnIDFilterOptions,
            value: policy.ui_hints.vulnID_filter,
            onChange: (e) => setPolicyAttribute(index, "vulnID_filter", e.target.value),
          })}
          {policy.ui_hints.vulnID_filter === "on" && (
            <>
              {" regex "}
              {makeTextInput({
                value: policy.match_vulnerability_id,
                isEditable,
                onChange: (e) => {
                  setPolicyAttribute(index, "match_vulnerability_id", e.target.value)
                },
              })}
              {(isEditable || policy.except_tag) && (
                <>
                  {" but not regex "}
                  {makeTextInput({
                    value: policy.except_vulnerability_id,
                    isEditable,
                    onChange: (e) => {
                      setPolicyAttribute(index, "except_vulnerability_id", e.target.value)
                    },
                  })}
                </>
              )}
            </>
          )}
          <div>
            <textarea
              data-testid="textArea"
              className="tw-w-full tw-mt-2"
              placeholder="Assessment"
              value={policy.action.assessment}
              onChange={(e) => {
                setPolicyAttribute(index, "assessment", e.target.value)
              }}
            ></textarea>
          </div>
        </div>
        {validationError && (
          <p data-testid={"validationText"} className="text-danger">
            {validationError}
          </p>
        )}
      </td>
      <td>
        {isEditable && (
          <button className="btn btn-link" onClick={(e) => removePolicy(index)}>
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}

export default SecurityScanPoliciesEditRow
