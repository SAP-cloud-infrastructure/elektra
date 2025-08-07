import React from "react"
import { MoveOperation } from "../componentHelpers/MoveOperation"
import { SelectBox } from "../componentHelpers/SelectBox"
import { TextInput } from "../componentHelpers/TextInput"
import { validatePolicy } from "./utils"

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
        {
          <SelectBox
            testID="severityBox"
            isEditable={isEditable}
            options={severityOptions}
            value={policy.ui_hints.severity}
            onChange={(e) => setPolicyAttribute(index, "severity", e.target.value)}
          />
        }
      </td>
      <td className="form-inline">
        <div className="policy-matching-rule-line">
          {
            <SelectBox
              isEditable={isEditable}
              options={repoFilterOptions}
              value={policy.ui_hints.repo_filter}
              onChange={(e) => setPolicyAttribute(index, "repo_filter", e.target.value)}
            />
          }
          {policy.ui_hints.repo_filter === "on" && (
            <>
              {" regex "}
              {
                <TextInput
                  value={policy.match_repository}
                  isEditable={isEditable}
                  onChange={(e) => {
                    setPolicyAttribute(index, "match_repository", e.target.value)
                  }}
                />
              }
              {(isEditable || policy.except_repository) && (
                <>
                  {" but not regex "}
                  {
                    <TextInput
                      value={policy.except_repository}
                      isEditable={isEditable}
                      onChange={(e) => {
                        setPolicyAttribute(index, "except_repository", e.target.value)
                      }}
                    />
                  }
                </>
              )}
            </>
          )}
        </div>
        <div className="policy-matching-rule-line">
          {
            <SelectBox
              isEditable={isEditable}
              options={vulnIDFilterOptions}
              value={policy.ui_hints.vulnID_filter}
              onChange={(e) => setPolicyAttribute(index, "vulnID_filter", e.target.value)}
            />
          }
          {policy.ui_hints.vulnID_filter === "on" && (
            <>
              {" regex "}
              {
                <TextInput
                  value={policy.match_vulnerability_id}
                  isEditable={isEditable}
                  onChange={(e) => {
                    setPolicyAttribute(index, "match_vulnerability_id", e.target.value)
                  }}
                />
              }
              {(isEditable || policy.except_tag) && (
                <>
                  {" but not regex "}
                  {
                    <TextInput
                      value={policy.except_vulnerability_id}
                      isEditable={isEditable}
                      onChange={(e) => {
                        setPolicyAttribute(index, "except_vulnerability_id", e.target.value)
                      }}
                    />
                  }
                </>
              )}
            </>
          )}
          <div>
            <textarea
              data-testid="textArea"
              className="tw-w-full tw-mt-2"
              disabled={!isEditable}
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
