import { connect } from "react-redux"
import EditForm from "../components/project_role_assignments_form.tsx"

import { updateProjectMemberRoleAssignments } from "../actions/project_role_assignments"
import { fetchRolesIfNeeded } from "../actions/roles"

export default connect(
  (state) => ({ availableRoles: state.role_assignments.roles }),
  (dispatch, ownProps) => {
    let type = ownProps.memberType.toLowerCase()

    return {
      updateProjectMemberRoleAssignments: (projectId, memberId, roles) =>
        dispatch(updateProjectMemberRoleAssignments(projectId, type, memberId, roles)),
      loadRolesOnce: () => dispatch(fetchRolesIfNeeded()),
    }
  }
)(EditForm)
