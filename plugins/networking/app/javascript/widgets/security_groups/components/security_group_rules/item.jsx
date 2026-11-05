/* eslint-disable no-undef */
import React from "react"
import { Link } from "react-router-dom"
import {
  SECURITY_GROUP_RULE_DESCRIPTIONS,
  SECURITY_GROUP_RULE_PREDEFINED_TYPES,
  SECURITY_GROUP_RULE_PROTOCOLS,
} from "../../constants"

const Item = ({ rule, handleDelete, securityGroups }) => {
  const displayPort = () => {
    let port = rule.port_range_min || rule.port_range_max
    if (
      rule.port_range_min &&
      rule.port_range_max &&
      rule.port_range_min != rule.port_range_max
    ) {
      port = `${rule.port_range_min} - ${rule.port_range_max}`
    }
    if (!port) port = "Any"

    let ruleType = SECURITY_GROUP_RULE_PREDEFINED_TYPES.find(
      (r) => r.portRange == port && r.protocol == rule.protocol
    )
    if (ruleType) port = port + ` (${ruleType.label})`
    return port
  }

  const remoteSecurityGroup = () => {
    let nameOrId = rule.remote_group_id
    let group = securityGroups.find((g) => g.id == rule.remote_group_id)
    if (group) nameOrId = group.name
    return (
      <Link to={`/security-groups/${rule.remote_group_id}/rules`}>
        {nameOrId}
      </Link>
    )
  }

  const canDelete = policy.isAllowed("networking:rule_delete")

  return (
    <tr className={rule.status == "deleting" ? "updating" : ""}>
      <td>{rule.direction}</td>
      <td>{rule.ethertype}</td>
      <td>{rule.protocol || "Any"}</td>
      <td>{displayPort()}</td>
      <td>
        {rule.remote_ip_prefix ? (
          `IP: ${rule.remote_ip_prefix}`
        ) : rule.remote_group_id ? (
          <>
            <span>Group: </span>
            {remoteSecurityGroup()}
          </>
        ) : (
          "-"
        )}
      </td>
      <td>{rule.description}</td>
      <td>
        {canDelete && rule.status != "deleting" && (
          <a
            className="btn btn-secondary btn-sm hover-danger"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleDelete(rule.id)
            }}
          >
            <i className="fa fa-trash fa-fw"></i>
          </a>
        )}
      </td>
    </tr>
  )
}

export default Item
