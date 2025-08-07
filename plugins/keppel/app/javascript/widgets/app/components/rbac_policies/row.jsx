import { SelectBox } from "../componentHelpers/SelectBox"
import React from "react"

const permsOptions = [
  { value: "", label: "Grant: Nothing" },
  { value: "anonymous_pull", label: "Grant: Pull anonymously" },
  {
    value: "anonymous_first_pull",
    label: "Grant: Pull anonymously (even new images)",
  },
  { value: "pull", label: "Grant: Pull" },
  { value: "pull,push", label: "Grant: Pull & Push" },
  { value: "delete,pull,push", label: "Grant: Pull & Push & Delete" },
  { value: "delete,pull", label: "Grant: Pull & Delete" },
  { value: "delete", label: "Grant: Delete" },
]

const forbiddenPermsOptions = [
  { value: "", label: "Forbid: Nothing" },
  { value: "anonymous_pull", label: "Forbid: Pull anonymously" },
  {
    value: "anonymous_first_pull",
    label: "Forbid: Pull anonymously (even new images)",
  },
  { value: "pull", label: "Forbid: Pull" },
  { value: "pull,push", label: "Forbid: Pull & Push" },
  { value: "delete,pull,push", label: "Forbid: Pull & Push & Delete" },
  { value: "delete,pull", label: "Forbid: Pull & Delete" },
  { value: "push", label: "Forbid: Push" },
  { value: "delete,push", label: "Forbid: Push & Delete" },
  { value: "delete", label: "Forbid: Delete" },
]

const RBACPoliciesEditRow = ({
  index,
  policy,
  isEditable,
  isExternalReplica,
  setRepoRegex,
  setUserRegex,
  setSourceCIDR,
  setPermissions,
  setForbiddenPermissions,
  removePolicy,
}) => {
  const { match_repository: repoRegex, match_username: userRegex, match_cidr: sourceCIDR } = policy
  const currentPerms = policy.permissions.sort().join(",") || ""
  const currentPermsOptions = isExternalReplica
    ? permsOptions
    : permsOptions.filter((opt) => opt.value != "anonymous_first_pull")
  const currentForbiddenPerms = (policy.forbidden_permissions || []).sort().join(",") || ""
  const currentForbiddenPermsOptions = isExternalReplica
    ? forbiddenPermsOptions
    : forbiddenPermsOptions.filter((opt) => opt.value != "anonymous_first_pull")
  return (
    <tr>
      <td>
        {isEditable ? (
          <input
            type="text"
            value={repoRegex || ""}
            className="form-control"
            onChange={(e) => setRepoRegex(index, e.target.value)}
          />
        ) : repoRegex ? (
          <code>{repoRegex}</code>
        ) : (
          <em>Any</em>
        )}
      </td>
      <td>
        {isEditable ? (
          <input
            type="text"
            value={userRegex || ""}
            className="form-control"
            onChange={(e) => setUserRegex(index, e.target.value)}
            disabled={currentPerms == "anonymous_pull" || currentPerms == "anonymous_first_pull"}
          />
        ) : userRegex ? (
          <code>{userRegex}</code>
        ) : (
          <em>Any</em>
        )}
      </td>
      <td>
        {isEditable ? (
          <input
            type="text"
            value={sourceCIDR || ""}
            className="form-control"
            onChange={(e) => setSourceCIDR(index, e.target.value)}
          />
        ) : sourceCIDR ? (
          <code>{sourceCIDR}</code>
        ) : (
          <em>Any</em>
        )}
      </td>
      <td>
        {/* These <div> are required for having a proper line break between the two lines of text if `isEditable = false`. */}
        <div>
          <SelectBox
            isEditable={isEditable}
            options={currentPermsOptions}
            value={currentPerms}
            onChange={(e) => setPermissions(index, e.target.value)}
          />
        </div>
        <div>
          {
            <SelectBox
              isEditable={isEditable}
              options={currentForbiddenPermsOptions}
              value={currentForbiddenPerms}
              onChange={(e) => setForbiddenPermissions(index, e.target.value)}
            />
          }
        </div>
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

export default RBACPoliciesEditRow
