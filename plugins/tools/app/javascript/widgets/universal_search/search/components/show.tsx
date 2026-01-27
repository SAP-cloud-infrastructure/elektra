/* eslint-disable no-undef */
import React, { useState, useEffect } from "react"
import { Modal, Button, Tabs, Tab } from "react-bootstrap"
import { JsonViewer } from "@cloudoperators/juno-ui-components"
import { projectUrl, objectUrl, vCenterUrl } from "../../shared/object_link_helper"

import ProjectRoleAssignments from "plugins/identity/app/javascript/widgets/role_assignments/containers/project_role_assignments"
import UserRoleAssignments from "plugins/identity/app/javascript/widgets/role_assignments/containers/user_role_assignments"
import NetworkUsageStats from "plugins/networking/app/javascript/widgets/network_usage_stats/containers/application"
import Asr from "plugins/networking/app/javascript/widgets/asr/application"

import ObjectTopology from "../../topology/containers/object_topology"

// Type definitions
interface SearchItem {
  id: string
  name: string
  cached_object_type: string
  domain_id?: string
  payload: Record<string, unknown>
}

interface Aggregate {
  name: string
}

interface AggregatesState {
  items: Aggregate[]
}

interface ShowSearchObjectModalProps {
  item?: SearchItem
  project?: unknown
  aggregates?: AggregatesState
  match: {
    params: {
      id?: string
    }
    path?: string
  }
  location: {
    search: string
  }
  history: {
    replace: (path: string) => void
    goBack: () => void
  }
  load: (id: string) => Promise<void>
}

const ShowSearchObjectModal: React.FC<ShowSearchObjectModalProps> = (props) => {
  const [show, setShow] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load object on mount if it doesn't exist
  useEffect(() => {
    if (!props.item && props.match.params.id) {
      setIsFetching(true)
      props.load(props.match.params.id).catch((err) => {
        setIsFetching(false)
        setError(err)
      })
    }
  }, []) // Only run on mount

  // Update state when item is received
  useEffect(() => {
    if (props.item) {
      setShow(true)
      setIsFetching(false)
      setError(null)
    }
  }, [props.item])

  const restoreUrl = () => {
    if (show) return

    if (props.match && props.match.path) {
      const found = props.match.path.match(/(\/[^/]+)\/:id\/show/)
      if (found) {
        props.history.replace(found[1])
        return
      }
    }

    props.history.goBack()
  }

  const hide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShow(false)
  }

  const { item, aggregates } = props
  const vcAggregates = aggregates && aggregates.items ? aggregates.items.filter((a) => a.name.indexOf("vc-") === 0) : []
  const projectLink = projectUrl(item)
  const objectLink = objectUrl(item)
  const vCenterLink = vCenterUrl(item, vcAggregates)
  const found = props.location.search.match(/\\?tab=([^&]+)/)
  let activeTab = found ? found[1] : null
  const isProject = item && item.cached_object_type === "project"
  const isUser = item && item.cached_object_type === "user"
  const isDomain = item && item.cached_object_type === "domain"
  const isRouter = item && item.cached_object_type === "router"
  if (activeTab === "userRoles" && isDomain) activeTab = "data"

  return (
    <Modal
      show={show}
      onExited={restoreUrl}
      onHide={hide}
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
        {isFetching && (
          <>
            <span className="spinner" />
            Loading...
          </>
        )}
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
        <Button onClick={hide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ShowSearchObjectModal
