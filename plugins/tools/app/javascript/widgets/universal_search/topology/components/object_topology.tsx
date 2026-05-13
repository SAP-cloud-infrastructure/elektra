import React, { useState, useEffect, useCallback } from "react"
import { Graph } from "./graph"
import { JsonViewer } from "@cloudoperators/juno-ui-components"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopologyObject {
  id: string
  name: string
  cached_object_type: string
  children: string[]
  isFetching: boolean
  payload: Record<string, unknown>
}

interface Details {
  x: number
  y: number
  node: TopologyObject
}

interface ObjectTopologyProps {
  objectId: string
  objects?: Record<string, TopologyObject>
  loadRelatedObjects: (id: string) => void
  removeRelatedObjects: (id: string) => void
  resetState: () => void
  showFilter?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

const ObjectTopology: React.FC<ObjectTopologyProps> = ({
  objectId,
  objects,
  loadRelatedObjects,
  removeRelatedObjects,
  resetState,
  showFilter = true,
}) => {
  const [filterCollapsed, setFilterCollapsed] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({})
  const [details, setDetails] = useState<Details | null>(null)

  // Mount / unmount
  useEffect(() => {
    loadRelatedObjects(objectId)
    return () => {
      resetState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectId])

  // Initialise selectedTypes when objects first arrive
  useEffect(() => {
    if (Object.keys(selectedTypes).length === 0 && objects) {
      const availableObjectTypes: Record<string, boolean> = {}
      for (const obj of Object.values(objects)) {
        if (obj.cached_object_type) {
          availableObjectTypes[obj.cached_object_type] = true
        }
      }
      setSelectedTypes(availableObjectTypes)
    }
  }, [objects]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const availableObjectTypes = (): string[] => {
    if (!objects) return []
    return Object.values(objects)
      .map((obj) => obj.cached_object_type)
      .filter((elem, pos, arr) => arr.indexOf(elem) === pos)
  }

  const convertObjectToNodes = (): [TopologyObject[], Array<{ source: string; target: string }>] => {
    const nodes: Record<string, TopologyObject> = {}
    const links: Array<{ source: string; target: string }> = []

    if (objects) {
      for (const node of Object.values(objects)) {
        if (selectedTypes[node.cached_object_type]) {
          nodes[node.id] = node
        }
      }

      for (const node of Object.values(objects)) {
        for (const childId of node.children) {
          if (nodes[node.id] && nodes[childId]) {
            links.push({ source: node.id, target: childId })
          }
        }
      }
    }

    return [Object.values(nodes), links]
  }

  const showDetails = useCallback((event: { offsetX: number; offsetY: number }, node: TopologyObject) => {
    setDetails({ x: event.offsetX, y: event.offsetY, node })
  }, [])

  const toggleFilter = () => setFilterCollapsed((prev) => !prev)

  const updateSelectedTypes = (type: string) => {
    setSelectedTypes((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const options = availableObjectTypes()
  const [nodes, links] = convertObjectToNodes()

  return (
    <>
      {showFilter && (
        <div className="toolbar">
          <label>Show:</label>

          <div
            className={`dropdown ${filterCollapsed ? "" : "open"}`}
            tabIndex={0}
            onBlur={() => setFilterCollapsed(true)}
          >
            <button className="btn btn-default" type="button" onClick={toggleFilter}>
              Select ...
              <span className="caret"></span>
            </button>
            <ul className="dropdown-menu" style={{ maxHeight: 300, overflow: "auto" }}>
              {options.map((option, index) => (
                <li key={index}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      updateSelectedTypes(option)
                    }}
                  >
                    <i className={`fa fa-fw fa-${selectedTypes[option] ? "check-" : ""}square-o`}></i>
                    <span>{option}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Graph
        nodes={nodes}
        links={links}
        width={1138}
        height={600}
        loadRelatedObjects={loadRelatedObjects}
        removeRelatedObjects={removeRelatedObjects}
        showDetails={showDetails}
      />

      {details && (
        <div
          className="popover"
          style={{
            top: details.y,
            left: details.x,
            display: "block",
            maxWidth: 700,
            minWidth: 530,
          }}
        >
          <h3 className="popover-title">
            {`Details for ${details.node.cached_object_type} ${details.node.name}`}
            <button
              onClick={() => setDetails(null)}
              type="button"
              className="close"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </h3>
          <div className="popover-content">
            <JsonViewer data={details.node.payload} expanded={1} />
          </div>
        </div>
      )}
    </>
  )
}

export default ObjectTopology
