import React from "react"
import { MoveOperation } from "../modalHelpers/moveOperation"
import { validatePolicy } from "./utils"
import { makeSelectBox } from "../utils"

const repoFilterOptions = [
  { value: "off", label: "of all repositories" },
  { value: "on", label: "of repositories matching..." },
]
const tagFilterOptions = [
  { value: "off", label: "of all tags" },
  { value: "on", label: "of tags matching..." },
]
const deleteOptions = [
  { value: false, label: "Allow deletion" },
  { value: true, label: "Prevent deletion" },
]
const overwriteOptions = [
  { value: false, label: "Allow overwrite" },
  { value: true, label: "Prevent overwrite" },
]

const TagPoliciesEditRow = ({
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
          options: deleteOptions,
          value: policy.block_delete || false,
          onChange: () =>
            setPolicyAttribute(index, "block_delete", !policy.block_delete),
        })}
        {makeSelectBox({
          isEditable,
          options: overwriteOptions,
          value: policy.block_overwrite || false,
          onChange: () =>
            setPolicyAttribute(
              index,
              "block_overwrite",
              !policy.block_overwrite
            ),
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
            options: tagFilterOptions,
            value: policy.ui_hints.tag_filter,
            onChange: (e) =>
              setPolicyAttribute(index, "tag_filter", e.target.value),
          })}
          {policy.ui_hints.tag_filter === "on" && (
            <>
              {" regex "}
              {makeTextInput("match_tag", policy.match_tag)}
              {(isEditable || policy.except_tag) && (
                <>
                  {" but not regex "}
                  {makeTextInput("except_tag", policy.except_tag)}
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

export default TagPoliciesEditRow
