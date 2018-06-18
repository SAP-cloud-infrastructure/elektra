import { SearchField } from 'lib/components/search_field';
import { AjaxPaginate } from 'lib/components/ajax_paginate';
import { Highlighter } from 'react-bootstrap-typeahead';
import ProjectRoleAssignmentsInlineEdit from '../containers/project_role_assignments_form';

// This class renders project user role assignments
export default class ProjectRoleAssignmentsItem extends React.Component {
  state = {
    editMode: false //used for the switch between view and edit modes
  }

  // This method sorts roles by name
  sortRoles = (roles) =>
    roles.sort((r1,r2) => {
      if(r1.name < r2.name) return -1
      if(r1.name > r2.name) return 1
      return 0
    })

  render() {
    const item = this.props.item
    const searchTerm = this.props.searchTerm || ''
    const memberRoles = this.sortRoles(this.props.item.roles)
    const count = memberRoles.length
    const member = item[this.props.memberType]

    return(
      <tr>
        <td className='user-name-cell'>
          {/*user name*/}
          <Highlighter search={searchTerm}>
            {member.description ?
              `${member.description} (${member.name})`
              :
              member.name
            }
          </Highlighter>
          <br/>
          <span className='info-text'>
            <Highlighter search={searchTerm}>{member.id}</Highlighter>
          </span>
        </td>

        {this.state.editMode ? //edit mode
          <td colSpan={2}>
            <ProjectRoleAssignmentsInlineEdit
              projectId={this.props.projectId}
              memberId={member.id}
              memberRoles={this.props.item.roles}
              memberType={this.props.memberType}
              onSave={() => this.setState({editMode: false})}
              onCancel={() => this.setState({editMode: false})}/>
          </td>
          : // view mode
          <React.Fragment>
            <td>
              {  /* show role names with descriptions comma separated in a row */
                 memberRoles.map((role, index) =>
                   <span key={index}>
                     <strong>{role.name}</strong>
                     {role.description && ' ('+role.description.replace(/(.+)\s+\(.+\)/,"$1")+')'}
                     {index < count-1 && ', ' /* add comma unless last item */}
                   </span>
                 )
              }
            </td>
            <td>
              <button
                onClick={() => this.setState({editMode: true})}
                className='btn btn-default'>
                Edit
              </button>
            </td>
          </React.Fragment>
        }
      </tr>
    )
  }
}
