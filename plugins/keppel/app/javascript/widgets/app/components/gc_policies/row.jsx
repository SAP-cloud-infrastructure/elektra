import React from "react"
import { MoveOperation } from "../componentHelpers/MoveOperation"
import { SelectBox } from "../componentHelpers/SelectBox"
import { TextInput } from "../componentHelpers/TextInput"
import { validatePolicy } from "./utils"

const actionOptions = [
  { value: "protect", label: "Protect image" },
  { value: "delete", label: "Delete image" },
]
const repoFilterOptions = [
  { value: "off", label: "regardless of repository" },
  { value: "on", label: "if repository name matches..." },
]
const tagFilterOptions = [
  { value: "off", label: "regardless of tags" },
  { value: "on", label: "if tag name matches..." },
  { value: "untagged", label: "if image does not have tags" },
]
const timestampOptions = [
  { value: "off", label: "regardless of age" },
  { value: "pushed_at", label: "if push timestamp of image..." },
  { value: "last_pulled_at", label: "if last pull timestamp of image..." },
]
const timeConstraintOptions = [
  { value: "older_than", label: "is older than..." },
  { value: "newer_than", label: "is newer than..." },
  { value: "oldest", label: "is among the oldest..." },
  { value: "newest", label: "is among the newest..." },
]
const timeUnitOptions = [
  { value: "s", label: "seconds" },
  { value: "m", label: "minutes" },
  { value: "h", label: "hours" },
  { value: "d", label: "days" },
  { value: "w", label: "weeks" },
  { value: "y", label: "years" },
]

const GCPoliciesEditRow = ({
  index,
  policy,
  policyCount,
  isEditable,
  movePolicy,
  setPolicyAttribute,
  removePolicy,
}) => {
  const makeNumberInput = (attr, value) => {
    value = value || 0
    if (!isEditable) {
      return <code>{value.toString()}</code>
    }
    return (
      <input
        type="number"
        value={value.toString()}
        className="form-control"
        min="1"
        onChange={(e) => setPolicyAttribute(index, attr, parseInt(e.target.value, 10))}
      />
    )
  }

  const timeConstraint = policy.time_constraint || {}
  const currentTimestampOption = timeConstraint.on || "off"
  const currentTimeConstraintOption = timeConstraintOptions.map((o) => o.value).find((key) => key in timeConstraint)

  const validationError = validatePolicy(policy)

  return (
    <tr>
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
            isEditable={isEditable}
            options={actionOptions}
            value={policy.action}
            onChange={(e) => setPolicyAttribute(index, "action", e.target.value)}
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
              <TextInput
                value={policy.match_repository}
                isEditable={isEditable}
                onChange={(e) => {
                  setPolicyAttribute(index, "match_repository", e.target.value)
                }}
              />
              {(isEditable || policy.except_repository) && (
                <>
                  {" but not regex "}
                  <TextInput
                    value={policy.except_repository}
                    isEditable={isEditable}
                    onChange={(e) => {
                      setPolicyAttribute(index, "except_repository", e.target.value)
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
        <div className="policy-matching-rule-line">
          {
            <SelectBox
              isEditable={isEditable}
              options={tagFilterOptions}
              value={policy.ui_hints.tag_filter}
              onChange={(e) => setPolicyAttribute(index, "tag_filter", e.target.value)}
            />
          }
          {policy.ui_hints.tag_filter === "on" && (
            <>
              {" regex "}
              <TextInput
                value={policy.match_tag}
                isEditable={isEditable}
                onChange={(e) => {
                  setPolicyAttribute(index, "match_tag", e.target.value)
                }}
              />
              {(isEditable || policy.except_tag) && (
                <>
                  {" but not regex "}
                  <TextInput
                    value={policy.except_tag}
                    isEditable={isEditable}
                    onChange={(e) => {
                      setPolicyAttribute(index, "except_tag", e.target.value)
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
        <div className="policy-matching-rule-line">
          {
            <SelectBox
              isEditable={isEditable}
              options={timestampOptions}
              value={currentTimestampOption}
              onChange={(e) => setPolicyAttribute(index, "timestamp", e.target.value)}
            />
          }
          {currentTimestampOption !== "off" && (
            <>
              {" "}
              {
                <SelectBox
                  isEditable={isEditable}
                  options={timeConstraintOptions}
                  value={currentTimeConstraintOption}
                  onChange={(e) => setPolicyAttribute(index, "time_constraint", e.target.value)}
                />
              }
              {(currentTimeConstraintOption === "oldest" || currentTimeConstraintOption == "newest") && (
                <>
                  {" "}
                  {makeNumberInput(currentTimeConstraintOption, policy.time_constraint[currentTimeConstraintOption])}
                  {" in this repository"}
                </>
              )}
              {(currentTimeConstraintOption === "older_than" || currentTimeConstraintOption == "newer_than") && (
                <>
                  {" "}
                  {makeNumberInput(
                    currentTimeConstraintOption,
                    policy.time_constraint[currentTimeConstraintOption].value
                  )}{" "}
                  {
                    <SelectBox
                      isEditable={isEditable}
                      options={timeUnitOptions}
                      value={policy.time_constraint[currentTimeConstraintOption].unit}
                      onChange={(e) => setPolicyAttribute(index, "time_unit", e.target.value)}
                    />
                  }
                </>
              )}
            </>
          )}
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

export default GCPoliciesEditRow
