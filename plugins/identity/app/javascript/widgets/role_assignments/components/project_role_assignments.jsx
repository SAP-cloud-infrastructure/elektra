import { SearchField } from "lib/components/search_field"
import ProjectRoleAssignment from "./project_role_assignment"
import { regexString } from "lib/tools/regex_string"
import { AutocompleteField } from "lib/components/autocomplete_field"
import ProjectRoleAssignmentForm from "../containers/project_role_assignments_form"
import { Tooltip } from "lib/components/Overlay"
import { policy } from "lib/policy"
import React from "react"

export default class ProjectRoleAssignments extends React.Component {
  state = {
    filterString: null,
    showNewMemberForm: false,
    newMember: null,
    showNewMemberInput: false,
  }

  componentDidMount() {
    this.props.loadProjectRoleAssignments(this.props.projectId)
  }

  filterRoleAssignments = () => {
    if (!this.props.items) return []

    if (!this.state.filterString || this.state.filterString.trim().length == 0) {
      return this.props.items
    }

    const regex = new RegExp(regexString(this.state.filterString.trim()), "i")
    return this.props.items.filter((role) => {
      let item = role[this.props.type]
      return `${item.name} ${item.description} ${item.id}`.match(regex)
    })
  }

  // this function handles the selection of a new member in the autocomplete field
  handleNewMember = (member, isValid) => {
    // if isValid is defined, use it
    // otherwise, determine validity based on member type
    let validMember = isValid !== undefined ? isValid : false

    // if an array is given, take the first element and ignore the rest
    if (Array.isArray(member)) member = member[0]

    if (!member) {
      return this.setState({ newMember: null, isValidMember: false })
    }

    if (member.constructor == String) {
      if (member.trim().length == 0) {
        this.setState({ newMember: null, isValidMember: false })
      } else {
        // String input is NOT valid (was not selected from list)
        this.setState({
          newMember: { id: member },
          isValidMember: false,
        })
      }
    } else if (member.constructor == Object) {
      // Object selection is valid (was selected from list)
      this.setState({
        newMember: {
          id: member.id,
          name: member.name,
          description: member.full_name || member.description,
        },
        isValidMember: validMember !== undefined ? validMember : true,
      })
    } else {
      this.setState({ newMember: null, isValidMember: false })
    }
  }

  resetNewMemberState = () => {
    this.setState({
      showNewMemberForm: false,
      showNewMemberInput: false,
      newMember: null,
      isValidMember: false,
    })
  }

  alreadyMember = () => {
    if (!this.props.items || this.props.items.length == 0) {
      return false
    }

    const item = this.props.items.find((i) => {
      let member = i[this.props.type]
      return member && (member.id == this.state.newMember.id || member.name == this.state.newMember.name)
    })
    return item ? true : false
  }

  render() {
    const canList =
      this.props.type == "user"
        ? policy.isAllowed("identity:project_member_list")
        : policy.isAllowed("identity:project_group_list")

    if (!canList) {
      return <div className="alert">You are not allowed to see role assignments</div>
    }

    const items = this.filterRoleAssignments()
    const isMember = this.state.newMember && this.alreadyMember()
    const memberLabel = this.props.type.charAt(0).toUpperCase() + this.props.type.slice(1)
    const hasItems = this.props.items && this.props.items.length > 0
    const canCreate =
      this.props.type == "user"
        ? policy.isAllowed("identity:project_member_create")
        : policy.isAllowed("identity:project_group_create")

    return (
      <>
        <div className="toolbar">
          {!this.state.showNewMemberInput && hasItems && (
            <>
              <SearchField
                onChange={(term) => this.setState({ filterString: term })}
                placeholder={`Name ${this.props.type == "user" ? ", C/D/I-number, " : ""} or ID`}
                isFetching={false}
                searchIcon={true}
                text={`Filter ${this.props.type}s by name or id`}
              />
              <span className="toolbar-input-divider"></span>
            </>
          )}

          {(!this.props.items || this.props.isFetching) && (
            <div className="toolbar-container">
              <span className="spinner"></span>Loading ...
            </div>
          )}

          {canCreate && (
            <div className="main-buttons">
              {this.state.showNewMemberInput ? (
                <div className="input-group input-group-left-button">
                  <span className="input-group-btn">
                    <button className="btn btn-default" onClick={() => this.setState({ showNewMemberInput: false })}>
                      x
                    </button>
                  </span>
                  <div className="autocomplete-bottom">
                    <AutocompleteField
                      liveSearch={true}
                      type={`${this.props.type}s`}
                      domainId={this.props.projectDomainId}
                      onSelected={this.handleNewMember}
                    />
                  </div>
                  <span className="input-group-btn">
                    <button
                      className="btn btn-primary"
                      disabled={isMember || !this.state.newMember || !this.state.isValidMember}
                      onClick={() => this.setState({ showNewMemberForm: true })}
                    >
                      {isMember ? (
                        <Tooltip
                          placement="top"
                          content={`This ${this.props.type} is already a member of this project!`}
                        >
                          <span>Add</span>
                        </Tooltip>
                      ) : (
                        <span>Add</span>
                      )}
                    </button>
                  </span>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={() => this.setState({ showNewMemberInput: true })}>
                  Add New Member
                </button>
              )}
            </div>
          )}
        </div>

        {!hasItems && !this.props.isFetching && !this.state.showNewMemberForm && (
          <div className="alert">{`No ${this.props.type} role assignments for this project yet`}</div>
        )}

        {(items.length > 0 || this.state.showNewMemberForm) && (
          <table className="table">
            <thead>
              <tr>
                <th>{memberLabel}</th>
                <th>Roles</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {this.state.showNewMemberForm && (
                <tr>
                  <td className="user-name-cell">
                    {this.state.newMember && (
                      <>
                        {this.state.newMember.description
                          ? `${this.state.newMember.description} (${this.state.newMember.name})`
                          : this.state.newMember.name}
                        <br />
                        <span className="info-text">{this.state.newMember.id}</span>
                      </>
                    )}
                  </td>

                  <td colSpan={2}>
                    {this.state.newMember && (
                      <ProjectRoleAssignmentForm
                        projectId={this.props.projectId}
                        memberId={this.state.newMember.id}
                        memberType={this.props.type}
                        memberRoles={[]}
                        onSave={this.resetNewMemberState}
                        onCancel={this.resetNewMemberState}
                      />
                    )}
                  </td>
                </tr>
              )}
              {items.map((item, index) => (
                <ProjectRoleAssignment
                  item={item}
                  key={index}
                  projectId={this.props.projectId}
                  memberType={this.props.type}
                  searchTerm={this.state.filterString}
                />
              ))}
            </tbody>
          </table>
        )}

        {/*<AjaxPaginate
          hasNext={this.props.projects.hasNext}
          isFetching={this.props.projects.isFetching}
          text={`${this.props.projects.items.length}/${this.props.projects.total}`}
          onLoadNext={() => this.props.loadNext({domain: this.state.domain, project: this.state.project})}/>
        */}
      </>
    )
  }
}
