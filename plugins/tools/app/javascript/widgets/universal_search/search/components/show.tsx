import React, { useState, useEffect } from "react"
import { Spinner, JsonViewer } from "@cloudoperators/juno-ui-components"
import { Tabs, Tab, Modal, Button } from "react-bootstrap"
import { projectUrl, objectUrl, vCenterUrl } from "../../shared/object_link_helper"

import ProjectRoleAssignments from "plugins/identity/app/javascript/widgets/role_assignments/containers/project_role_assignments"
import UserRoleAssignments from "plugins/identity/app/javascript/widgets/role_assignments/containers/user_role_assignments"
import NetworkUsageStats from "plugins/networking/app/javascript/widgets/network_usage_stats/containers/application"
import Asr from "plugins/networking/app/javascript/widgets/asr/application"

import ObjectTopology from "../../topology/containers/object_topology"

interface PolicyType {
  isAllowed: (permission: string, options?: Record<string, unknown>) => boolean
}

declare global {
  var policy: PolicyType
}

interface Item {
  id: string
  name: string
  cached_object_type: string
  domain_id?: string
  project_id?: string
  payload: Record<string, unknown>
}

interface AggregatesState {
  items: Array<{ name: string; [key: string]: unknown }>
}

interface Match {
  params: { id?: string }
  path: string
}

interface History {
  replace: (path: string) => void
  goBack: () => void
}

interface ShowSearchObjectModalProps {
  item?: Item
  project?: object
  aggregates?: AggregatesState
  match: Match
  location: { search: string }
  history: History
  load: (id: string) => Promise<void>
}

const ShowSearchObjectModal: React.FC<ShowSearchObjectModalProps> = ({
  item,
  aggregates,
  match,
  location,
  history,
  load,
}) => {
  const [show, setShow] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the item on mount if it isn't already in the store
  useEffect(() => {
    if (!item && match.params.id) {
      setIsFetching(true)
      load(match.params.id).catch((err) => {
        setIsFetching(false)
        setError(err)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the item arrives via props, clear the loading state
  useEffect(() => {
    if (item) {
      setShow(true)
      setIsFetching(false)
      setError(null)
    }
  }, [item])

  // Combines hide + restoreUrl: closes the modal and navigates back
  const close = () => {
    setShow(false)
    if (match?.path) {
      const found = match.path.match(/(\/[^/]+)\/:id\/show/)
      if (found) {
        history.replace(found[1])
        return
      }
    }
    history.goBack()
  }

  const vcAggregates =
    aggregates && aggregates.items ? aggregates.items.filter((a) => a.name.indexOf("vc-") === 0) : []
  const projectLink = projectUrl(item)
  const objectLink = objectUrl(item)
  const vCenterLink = vCenterUrl(item, vcAggregates)

  const tabMatch = location.search.match(/\?tab=([^&]+)/)
  let activeTab = tabMatch ? tabMatch[1] : null

  const isProject = item && item.cached_object_type === "project"
  const isUser = item && item.cached_object_type === "user"
  const isDomain = item && item.cached_object_type === "domain"
  const isRouter = item && item.cached_object_type === "router"

  if (activeTab === "userRoles" && isDomain) activeTab = "data"

  const modalTitle = item
    ? `Show ${item.cached_object_type} ${item.name} (${item.id})`
    : "Show"

  return (
    <Modal
      show={show}
      onHide={close}
      dialogClassName="modal-xl"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isFetching && <Spinner />}
        {error && <span>{error}</span>}
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
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowSearchObjectModal
