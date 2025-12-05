import { useCallback } from "react"
import { Tabs, Tab } from "react-bootstrap"
import ProjectRoleAssignments from "../containers/project_role_assignments"
import RoleInfos from "../containers/RoleInfos"
import React from "react"

const RoleAssignments = ({ activeTab, projectId, domainId }) => {
  // update browser address bar
  const handleSelect = useCallback((tab) => {
    const newHref = window.location.href.replace(/^(.*active_tab=)(.*)$/, "$1" + tab)
    window.history.replaceState({}, "Tab " + tab, newHref)
  })

  return (
    <Tabs defaultActiveKey={activeTab || "userRoles"} id="item_payload" onSelect={handleSelect}>
      <Tab eventKey="userRoles" title="User Role Assignments">
        <ProjectRoleAssignments projectId={projectId} projectDomainId={domainId} type="user" />
      </Tab>
      <Tab eventKey="groupRoles" title="Group Role Assignments">
        <ProjectRoleAssignments projectId={projectId} projectDomainId={domainId} type="group" />
      </Tab>
      <Tab eventKey="roleInfos" title="Role Infos">
        <RoleInfos />
      </Tab>
    </Tabs>
  )
}

export default RoleAssignments
