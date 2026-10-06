/* eslint-disable no-undef */
import { Link } from "react-router-dom"
import React from "react"

const Item = ({ securityGroup, handleDelete, project }) => {
  const canDelete = policy.isAllowed("networking:security_group_delete")
  const canUpdate = false //policy.isAllowed("networking:security_group_update")
  const canManagePermissions = policy.isAllowed(
    "networking:security_groups_rbac_policy_create",
    { security_group: securityGroup }
  )

  return (
    <tr className={securityGroup.deleting ? "updating" : ""}>
      <td>
        {policy.isAllowed("networking:security_group_get") ? (
          <Link to={`/security-groups/${securityGroup.id}/rules`}>
            {securityGroup.name || securityGroup.id}
          </Link>
        ) : (
          securityGroup.name || securityGroup.id
        )}
        {securityGroup.name && (
          <>
            <br />
            <span className="info-text">{securityGroup.id}</span>
          </>
        )}
      </td>
      <td>{securityGroup.description}</td>
      <td>
        {project ? (
          <div>
            {project.name}
            <br />
            <span className="info-text">{project.id}</span>
          </div>
        ) : (
          securityGroup.project_id
        )}
      </td>
      <td>{securityGroup.shared ? "Yes" : "No"}</td>
      <td>
        {(canDelete || canUpdate || canManagePermissions) &&
          securityGroup.name != "default" && (
            <div className="btn-group">
              <button
                className="btn btn-secondary btn-sm dropdown-toggle"
                type="button"
                disabled={securityGroup.deleting}
                data-bs-toggle="dropdown"
                aria-expanded="true"
              >
                <i className="fa fa-cog"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-right" role="menu">
                {canManagePermissions && (
                  <li>
                    <Link to={`/${securityGroup.id}/rbacs`}>
                      Access Control
                    </Link>
                  </li>
                )}
                {canUpdate && (
                  <li>
                    <Link to={`/${securityGroup.id}/edit`}>Edit</Link>
                  </li>
                )}
                {canDelete && (
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(securityGroup.id)
                      }}
                    >
                      Delete
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
      </td>
    </tr>
  )
}

export default Item
