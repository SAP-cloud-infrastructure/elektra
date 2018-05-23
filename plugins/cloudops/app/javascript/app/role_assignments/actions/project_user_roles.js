import * as constants from '../constants';
import { ajaxHelper } from 'ajax_helper';
import { confirm } from 'lib/dialogs';
import { addNotice as showNotice, addError as showError } from 'lib/flashes';
import { ErrorsList } from 'lib/elektra-form/components/errors_list';

//################### OBJECTS #########################
const requestProjectRoles= (projectId) => (
  {
    type: constants.REQUEST_PROJECT_ROLES,
    requestedAt: Date.now(),
    projectId
  }
);

const requestProjectRolesFailure= (projectId) => (
  {
    type: constants.REQUEST_PROJECT_ROLES_FAILURE,
    projectId
  }
);

const receiveProjectRoles= (projectId, roles) => (
  {
    type: constants.RECEIVE_PROJECT_ROLES,
    receivedAt: Date.now(),
    projectId,
    roles
  }
);

const receiveProjectUserRoles= (projectId, userId, roles) => (
  {
    type: constants.RECEIVE_PROJECT_USER_ROLES,
    projectId,
    userId,
    roles
  }
);

const fetchProjectRoles = (projectId) =>
  (dispatch) => {
    dispatch(requestProjectRoles(projectId));
    ajaxHelper.get(`/role_assignments?scope_project_id=${projectId}`).then( (response) => {
      dispatch(receiveProjectRoles(projectId, response.data.roles));
    })
    .catch( (error) => {
      dispatch(requestProjectRolesFailure());
      showError(`Could not load project roles (${error.message})`)
    });
  }
;

const updateProjectUserRoles = (projectId, userId, roles) =>
  (dispatch) =>
    ajaxHelper.put(
      '/role_assignments', {scope_project_id: projectId, user_id: userId, roles}
    ).then((response) => dispatch(receiveProjectUserRoles(projectId,userId, response.data.roles)))


export {
  fetchProjectRoles,
  updateProjectUserRoles
}
