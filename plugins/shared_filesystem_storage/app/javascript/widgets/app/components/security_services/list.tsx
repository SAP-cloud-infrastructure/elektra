/* eslint-disable react/no-unescaped-entities */
import React, { useEffect } from "react"
import SecurityServiceItem from "./item"
// @ts-expect-error - lib/policy has no TypeScript definitions
import { policy } from "lib/policy"
// @ts-expect-error - lib/components/defeatable_link has no TypeScript definitions
import { DefeatableLink } from "lib/components/defeatable_link"
// @ts-expect-error - lib/components/Overlay has no TypeScript definitions
import { Popover } from "lib/components/Overlay"

interface SecurityService {
  id: string
  name?: string
  type: string
  isDeleting?: boolean
}

interface SecurityServiceListProps {
  active: boolean
  isFetching: boolean
  securityServices: SecurityService[]
  loadSecurityServicesOnce: () => void
  handleDelete: (id: string) => void
}

const CreateNewButton: React.FC = () => {
  if (!policy.isAllowed("shared_filesystem_storage:share_network_create")) {
    return (
      <Popover
        title="Missing Create Permission"
        content="You don't have permission to create a security service. Please check if
        you have the role sharedfilesystem_admin."
        placement="top"
      >
        <button className="btn btn-primary disabled">
          <i className="fa fa-fw fa-exclamation-triangle fa-2"></i> Create New
        </button>
      </Popover>
    )
  }

  return (
    <DefeatableLink to="/security-services/new" className="btn btn-primary">
      Create New
    </DefeatableLink>
  )
}

const SecurityServiceList: React.FC<SecurityServiceListProps> = ({
  active,
  isFetching,
  securityServices,
  loadSecurityServicesOnce,
  handleDelete,
}) => {
  useEffect(() => {
    if (active) {
      loadSecurityServicesOnce()
    }
  }, [active, loadSecurityServicesOnce])

  return (
    <>
      <div className="toolbar">
        <div className="main-buttons">
          <CreateNewButton />
        </div>
      </div>

      {isFetching ? (
        <div className="loadig">
          <span className="spinner" />
          {"Loading..."}
        </div>
      ) : (
        <table className="table security-services">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {securityServices.length === 0 ? (
              <tr>
                <td colSpan={3}>No Security Service found.</td>
              </tr>
            ) : (
              securityServices.map((securityService) => (
                <SecurityServiceItem
                  key={securityService.id}
                  securityService={securityService}
                  handleDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      )}
    </>
  )
}

export default SecurityServiceList
