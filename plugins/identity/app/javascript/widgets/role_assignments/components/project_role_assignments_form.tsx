import React, { useState, useEffect, useCallback, useRef } from "react"
// @ts-expect-error missing types
import { Tooltip } from "lib/components/Overlay"
// @ts-expect-error missing types
import makeCancelable from "lib/tools/cancelable_promise"

interface Role {
  id: string
  name: string
  description?: string
  restricted?: boolean
}

interface AvailableRoles {
  items: Role[]
  isFetching: boolean
}

interface ProjectRoleAssignmentsInlineFormProps {
  projectId: string
  memberId: string
  memberType: string
  memberRoles: Role[]
  availableRoles: AvailableRoles | null
  loadRolesOnce: () => void
  updateProjectMemberRoleAssignments: (projectId: string, memberId: string, roleIds: string[]) => Promise<void>
  onSave: () => void
  onCancel: () => void
}

// This component renders edit form for project role assignments
const ProjectRoleAssignmentsInlineForm: React.FC<ProjectRoleAssignmentsInlineFormProps> = ({
  projectId,
  memberId,
  memberType,
  memberRoles,
  availableRoles,
  loadRolesOnce,
  updateProjectMemberRoleAssignments,
  onSave,
  onCancel,
}) => {
  const [currentMemberRoleIDs, setCurrentMemberRoleIDs] = useState<string[]>([])
  const [newMemberRoleIDs, setNewMemberRoleIDs] = useState<string[]>([])
  const [sortedAvailableRoles, setSortedAvailableRoles] = useState<Role[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string | null>(null)

  const submitPromiseRef = useRef<ReturnType<typeof makeCancelable> | null>(null)

  // This function sorts roles by name
  const sortRoles = useCallback((roles: Role[]): Role[] => {
    return [...roles].sort((r1, r2) => {
      if (r1.name < r2.name) return -1
      if (r1.name > r2.name) return 1
      return 0
    })
  }, [])

  // Initialize state on mount (replaces componentDidMount)
  useEffect(() => {
    const roleIDs = memberRoles.map((r) => r.id)
    setCurrentMemberRoleIDs(roleIDs)
    setNewMemberRoleIDs(roleIDs)

    if (availableRoles) {
      setSortedAvailableRoles(sortRoles(availableRoles.items))
    }

    // Trigger loadRolesOnce after state is set
    loadRolesOnce()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update available roles when they become available (replaces UNSAFE_componentWillReceiveProps)
  useEffect(() => {
    if (sortedAvailableRoles.length === 0 && availableRoles) {
      setSortedAvailableRoles(sortRoles(availableRoles.items))
    }
  }, [availableRoles, sortedAvailableRoles.length, sortRoles])

  // Cleanup on unmount (replaces componentWillUnmount)
  useEffect(() => {
    return () => {
      // Cancel submit promise if already created
      if (submitPromiseRef.current) {
        submitPromiseRef.current.cancel()
      }
    }
  }, [])

  // This function updates the state of newMemberRoleIDs
  const updateMemberRole = useCallback((roleId: string, checked: boolean) => {
    setNewMemberRoleIDs((prevRoleIDs) => {
      const index = prevRoleIDs.indexOf(roleId)

      if ((index >= 0 && checked) || (index < 0 && !checked)) return prevRoleIDs

      const newRoleIDs = [...prevRoleIDs]
      if (index >= 0 && !checked) {
        newRoleIDs.splice(index, 1)
      }
      if (index < 0 && checked) {
        newRoleIDs.push(roleId)
      }

      return newRoleIDs
    })
  }, [])

  const hasChanged = useCallback((): boolean => {
    const oldRoles = [...currentMemberRoleIDs].sort().join("")
    const newRoles = [...newMemberRoleIDs].sort().join("")

    return oldRoles !== newRoles
  }, [currentMemberRoleIDs, newMemberRoleIDs])

  // Called by save button
  const saveChanges = useCallback(() => {
    setSaving(true)

    submitPromiseRef.current = makeCancelable(updateProjectMemberRoleAssignments(projectId, memberId, newMemberRoleIDs))

    submitPromiseRef.current.promise
      .then(() => {
        setSaving(false)
        setErrors(null)
        onSave()
      })
      .catch((reason: { isCanceled?: boolean; message?: string }) => {
      if (!reason.isCanceled) {
        // promise is not canceled
        // handle errors
        setSaving(false)
        setErrors(reason.message || String(reason))
      }
      })
  }, [projectId, memberId, newMemberRoleIDs, updateProjectMemberRoleAssignments, onSave])

  // Leave edit mode
  const cancelEdit = useCallback(() => {
    onCancel()
  }, [onCancel])

  const removeAllRoles = useCallback(() => {
    setNewMemberRoleIDs([])
  }, [])

  // This function renders the edit view for project member role assignments
  const renderEditView = useCallback(() => {
    // create list items
    const lis = sortedAvailableRoles.map((role, index) => {
      const checked = newMemberRoleIDs.indexOf(role.id) >= 0
      const isNew = checked && currentMemberRoleIDs.indexOf(role.id) < 0
      const removed = !checked && currentMemberRoleIDs.indexOf(role.id) >= 0
      const roleDescription = role.description ? "(" + role.description.replace(/(.+)\s+\(.+\)/, "$1") + ")" : ""
      let labelClassName = ""
      if (isNew) {
        labelClassName = "bg-info"
      }
      if (removed) {
        labelClassName = "u-text-remove-highlight"
      }

      return (
        <li key={index}>
          <label className={labelClassName}>
            <input
              type="checkbox"
              checked={checked}
              value={role.id}
              onChange={(e) => updateMemberRole(e.target.value, e.target.checked)}
            />
            &nbsp;
            <span key={index}>
              <>
                <strong>{role.name}</strong> {roleDescription}
              </>
            </span>
          </label>
        </li>
      )
    })

    return (
      <div className="role-assignments">
        <ul role="menu">{lis}</ul>
      </div>
    )
  }, [sortedAvailableRoles, newMemberRoleIDs, currentMemberRoleIDs, updateMemberRole])

  const isEmpty = newMemberRoleIDs.length === 0
  const isFetching = !availableRoles || availableRoles.isFetching

  return (
    <>
      <div className="toolbar toolbar-inline">
        <div className="toolbar-container">
          {isFetching ? (
            <>
              <span className="spinner" />
              Loading ...
            </>
          ) : (
            <>
              <button className="btn btn-default btn-sm hover-danger" onClick={removeAllRoles} disabled={saving}>
                Remove All
              </button>
            </>
          )}
        </div>

        <div className="main-buttons">
          <button className="btn btn-default btn-sm" onClick={cancelEdit} disabled={saving}>
            Cancel
          </button>
          {!isFetching && isEmpty ? (
            <Tooltip
              placement="top"
              content={`This will remove ${memberType} from project role assignments. This may take several minutes.`}
            >
              <button className="btn btn-danger btn-sm" disabled={saving} onClick={saveChanges}>
                {saving ? "Please Wait ..." : "Remove Member"}
              </button>
            </Tooltip>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={saveChanges} disabled={!hasChanged() || saving}>
              {saving ? "Please Wait ..." : "Save"}
            </button>
          )}
        </div>
      </div>
      {errors && <div className="alert alert-error">{errors}</div>}
      {!isFetching && renderEditView()}
    </>
  )
}

export default ProjectRoleAssignmentsInlineForm
