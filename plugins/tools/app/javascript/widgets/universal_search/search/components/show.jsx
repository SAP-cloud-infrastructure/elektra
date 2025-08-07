/* eslint-disable no-undef */
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { JsonViewer } from "@cloudoperators/juno-ui-components"
import { projectUrl, objectUrl, vCenterUrl } from "../../shared/object_link_helper"
import React from "react"

import ProjectRoleAssignments from "plugins/identity/app/javascript/widgets/role_assignments/containers/project_role_assignments"
import UserRoleAssignments from "plugins/identity/app/javascript/widgets/role_assignments/containers/user_role_assignments"
import NetworkUsageStats from "plugins/networking/app/javascript/widgets/network_usage_stats/containers/application"
import Asr from "plugins/networking/app/javascript/widgets/asr/application"

import ObjectTopology from "../../topology/containers/object_topology"

export default class ShowSearchObjectModal extends React.Component {
  state = {
    show: true,
    isFetching: false,
    error: null,
  }

  componentDidMount = () => {
    // load object if it does not exist
    if (!this.props.item && this.props.match.params.id) {
      this.setState({ isFetching: true }, () =>
        this.props.load(this.props.match.params.id).catch((error) => this.setState({ isFetching: false, error }))
      )
    }
  }

  UNSAFE_componentWillReceiveProps = (props) => {
    if (props.item) {
      this.setState({ show: true, isFetching: false, error: null })
    }
  }

  restoreUrl = (e) => {
    if (this.state.show) return

    if (this.props.match && this.props.match.path) {
      const found = this.props.match.path.match(/(\/[^/]+)\/:id\/show/)
      if (found) {
        this.props.history.replace(found[1])
        return
      }
    }

    this.props.history.goBack()
  }

  hide = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  render() {
    const { item, project, aggregates } = this.props
    const vcAggregates =
      aggregates && aggregates.items ? aggregates.items.filter((a) => a.name.indexOf("vc-") === 0) : []
    const projectLink = projectUrl(item)
    const objectLink = objectUrl(item)
    const vCenterLink = vCenterUrl(item, vcAggregates)
    const found = this.props.location.search.match(/\?tab=([^&]+)/)
    let activeTab = found ? found[1] : null
    const isProject = item && item.cached_object_type == "project"
    const isUser = item && item.cached_object_type == "user"
    const isDomain = item && item.cached_object_type == "domain"
    const isRouter = item && item.cached_object_type == "router"
    if (activeTab == "userRoles" && isDomain) activeTab = "data"

    return (
      <Modal
        show={this.state.show}
        onExited={this.restoreUrl}
        onHide={this.hide}
        dialogClassName="modal-xl"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Show{" "}
            {item && (
              <>
                {item.cached_object_type} {item.name} ({item.id})
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.state.isFetching && (
            <>
              <span className="spinner" />
              Loading...
            </>
          )}
          {this.state.error && <span>{this.state.error}</span>}
          {item && (
            <Tabs defaultActiveKey={activeTab || "data"} id="item_payload" mountOnEnter>
              <Tab eventKey="data" title="Data">
                <JsonViewer data={item.payload} expanded={1} />
              </Tab>
              {isProject && policy.isAllowed("tools:universal_search_role_assignments") && (
                <Tab eventKey="userRoles" title="User Role Assignments">
                  <ProjectRoleAssignments projectId={item.id} projectDomainId={item.domain_id} type="user" />
                </Tab>
              )}
              {isProject && policy.isAllowed("tools:universal_search_role_assignments") && (
                <Tab eventKey="groupRoles" title="Group Role Assignments">
                  <ProjectRoleAssignments projectId={item.id} projectDomainId={item.domain_id} type="group" />
                </Tab>
              )}
              {isUser && policy.isAllowed("tools:universal_search_user_role_assignments", { user: item }) && (
                <Tab eventKey="userRoles" title="User Role Assignments">
                  <UserRoleAssignments userId={item.id} />
                </Tab>
              )}
              {(isProject || isDomain) && policy.isAllowed("tools:universal_search_netstats") && (
                <Tab eventKey="networkStats" title="Network Statistics">
                  <NetworkUsageStats scopeId={item.id} scopeType={isProject ? "project" : "domain"} />
                </Tab>
              )}
              {isRouter && policy.isAllowed("tools:universal_search_asr") && (
                <Tab eventKey="asr" title="ASR Info">
                  <Asr routerId={item.id} />
                </Tab>
              )}

              {policy.isAllowed("tools:universal_search_asr") && (
                <Tab eventKey="objectTopology" title="Topology">
                  <ObjectTopology size={[500, 500]} objectId={item.id} />
                </Tab>
              )}
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          {vCenterLink && (
            <a href={vCenterLink} target="_blank" className="btn btn-primary" rel="noreferrer">
              Switch to VCenter
            </a>
          )}

          {objectLink && (
            <a href={objectLink} target="_blank" className="btn btn-primary" rel="noreferrer">
              Show in Elektra
            </a>
          )}

          {projectLink && policy.isAllowed("tools:switch_to_project", { project: item }) && (
            <a href={projectLink} target="_blank" className="btn btn-primary" rel="noreferrer">
              Switch to Project
            </a>
          )}
          <Button onClick={this.hide}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
