import React from "react"
import { MoveOperation } from "../modalHelpers/moveOperation"
import { validatePolicy } from "./utils"
import { makeSelectBox, makeTextInput } from "../utils"

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
          testID: "deleteBox",
          isEditable,
          options: deleteOptions,
          value: policy.block_delete || false,
          onChange: () => setPolicyAttribute(index, "block_delete", !policy.block_delete),
        })}
        {makeSelectBox({
          testID: "overwriteBox",
          isEditable,
          options: overwriteOptions,
          value: policy.block_overwrite || false,
          onChange: () => setPolicyAttribute(index, "block_overwrite", !policy.block_overwrite),
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
            options: tagFilterOptions,
            value: policy.ui_hints.tag_filter,
            onChange: (e) => setPolicyAttribute(index, "tag_filter", e.target.value),
          })}
          {policy.ui_hints.tag_filter === "on" && (
            <>
              {" regex "}
              {makeTextInput({
                value: policy.match_tag,
                isEditable,
                onChange: (e) => {
                  setPolicyAttribute(index, "match_tag", e.target.value)
                },
              })}
              {(isEditable || policy.except_tag) && (
                <>
                  {" but not regex "}
                  {makeTextInput({
                    value: policy.except_tag,
                    isEditable,
                    onChange: (e) => {
                      setPolicyAttribute(index, "except_tag", e.target.value)
                    },
                  })}
                </>
              )}
            </>
          )}
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

export default TagPoliciesEditRow
