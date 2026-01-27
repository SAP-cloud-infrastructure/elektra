import React, { useState, useEffect, useMemo } from "react"
import { Graph } from "./graph"
import { JsonViewer } from "@cloudoperators/juno-ui-components"

// Type definitions
interface GraphObject {
  id: string
  name: string
  cached_object_type: string
  children: string[]
  isFetching?: boolean
  payload?: Record<string, unknown>
}

interface GraphNode extends GraphObject {
  label: string
}

interface GraphLink {
  source: string
  target: string
}

interface DetailsState {
  x: number
  y: number
  node: GraphNode
}

interface ObjectTopologyProps {
  objectId: string
  objects?: Record<string, GraphObject>
  showFilter?: boolean
  loadRelatedObjects: (objectId: string) => void
  removeRelatedObjects: (objectId: string) => void
  resetState: () => void
}

const ObjectTopology: React.FC<ObjectTopologyProps> = (props) => {
  const { objectId, objects, showFilter = true, loadRelatedObjects, removeRelatedObjects, resetState } = props

  const [filterCollapsed, setFilterCollapsed] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({})
  const [details, setDetails] = useState<DetailsState | null>(null)

  // Load related objects on mount
  useEffect(() => {
    loadRelatedObjects(objectId)

    // Cleanup on unmount
    return () => {
      resetState()
    }
  }, [objectId, loadRelatedObjects, resetState])

  // Set initial selected types when objects are loaded
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
  }, [objects, selectedTypes])

  const showDetailsHandler = (event: React.MouseEvent, node: GraphNode) => {
    setDetails({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY, node })
  }

  const availableObjectTypes = useMemo(() => {
    if (!objects) return []
    return Object.values(objects)
      .map((obj) => obj.cached_object_type)
      .filter((elem, pos, arr) => arr.indexOf(elem) === pos)
  }, [objects])

  const graphData = useMemo<[GraphNode[], GraphLink[]]>(() => {
    const nodes: Record<string, GraphNode> = {}
    const links: GraphLink[] = []

    if (objects) {
      for (const node of Object.values(objects)) {
        const newNode: GraphNode = {
          ...node,
          label: Graph.nodeLabel(node),
          isFetching: node.isFetching,
        }
        if (selectedTypes[newNode.cached_object_type]) {
          nodes[node.id] = newNode
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
  }, [objects, selectedTypes])

  const toggleFilter = () => {
    setFilterCollapsed(!filterCollapsed)
  }

  const updateSelectedTypes = (type: string) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  return (
    <>
      <div className="toolbar">
        <label>Show:</label>

        <div
          className={`dropdown ${filterCollapsed ? "" : "open"}`}
          tabIndex={0}
          onBlur={() => console.log("filter onBlur")}
        >
          <button className="btn btn-default" type="button" onClick={toggleFilter}>
            Select ...
            <span className="caret"></span>
          </button>
          <ul className="dropdown-menu" style={{ maxHeight: 300, overflow: "auto" }}>
            {availableObjectTypes.map((option, index) => (
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

      <Graph
        nodes={graphData[0]}
        links={graphData[1]}
        width={1138}
        height={600}
        loadRelatedObjects={loadRelatedObjects}
        removeRelatedObjects={removeRelatedObjects}
        showDetails={showDetailsHandler}
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
            <button onClick={() => setDetails(null)} type="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </h3>
          <div className="popover-content">
            <JsonViewer data={details.node.payload || {}} expanded={1} />
          </div>
        </div>
      )}
    </>
  )
}

export default ObjectTopology
