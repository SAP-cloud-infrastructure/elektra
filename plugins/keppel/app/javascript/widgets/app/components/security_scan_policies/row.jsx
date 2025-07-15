import React from "react"
import { MoveOperation } from "../modalHelpers/moveOperation"
import { validatePolicy } from "./utils"
import { makeSelectBox } from "../utils"

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
  const makeTextInput = (attr, value) => {
    value = value || ""
    if (!isEditable) {
      if (value === "") {
        return <em>Any</em>
      }
      return <code>{value || ""}</code>
    }
    return (
      <input
        type="text"
        value={value}
        style={{ width: "120px" }}
        className="form-control"
        onChange={(e) => setPolicyAttribute(index, attr, e.target.value)}
      />
    )
  }

  const validationError = validatePolicy(policy)

  return (
    <tr>
      {isEditable ? (
        <td key="order" className="policy-order-buttons">
          <MoveOperation
            index={index}
            itemCount={policyCount}
            onMove={movePolicy}
          />
        </td>
      ) : (
        <td key="order" className="policy-order-buttons"></td>
      )}
      <td>
        {makeSelectBox({
          isEditable,
          options: severityOptions,
          value: policy.ui_hints.severity,
          onChange: (e) =>
            setPolicyAttribute(index, "severity", e.target.value),
        })}
      </td>
      <td className="form-inline">
        <div className="policy-matching-rule-line">
          {makeSelectBox({
            isEditable,
            options: repoFilterOptions,
            value: policy.ui_hints.repo_filter,
            onChange: (e) =>
              setPolicyAttribute(index, "repo_filter", e.target.value),
          })}
          {policy.ui_hints.repo_filter === "on" && (
            <>
              {" regex "}
              {makeTextInput("match_repository", policy.match_repository)}
              {(isEditable || policy.except_repository) && (
                <>
                  {" but not regex "}
                  {makeTextInput("except_repository", policy.except_repository)}
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
            onChange: (e) =>
              setPolicyAttribute(index, "vulnID_filter", e.target.value),
          })}
          {policy.ui_hints.vulnID_filter === "on" && (
            <>
              {" regex "}
              {makeTextInput(
                "match_vulnerability_id",
                policy.match_vulnerability_id
              )}
              {(isEditable || policy.except_tag) && (
                <>
                  {" but not regex "}
                  {makeTextInput(
                    "except_vulnerability_id",
                    policy.except_vulnerability_id
                  )}
                </>
              )}
            </>
          )}
          <div>
            <textarea
              className="tw-w-full tw-mt-2"
              placeholder="Assessment"
              value={policy.action.assessment}
              onChange={(e) => {
                setPolicyAttribute(index, "assessment", e.target.value)
              }}
            ></textarea>
          </div>
        </div>
        {validationError && <p className="text-danger">{validationError}</p>}
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
