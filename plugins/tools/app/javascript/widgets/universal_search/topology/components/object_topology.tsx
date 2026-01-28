import React, { useState, useEffect } from "react"
import { Graph } from "./graph"
import { JsonViewer } from "@cloudoperators/juno-ui-components"

interface ObjectNode {
  id: string
  cached_object_type: string
  name: string
  children: string[]
  isFetching?: boolean
  payload: unknown
  [key: string]: unknown
}

interface NodeWithLabel extends ObjectNode {
  label: string
}

interface GraphLink {
  source: string
  target: string
}

interface Details {
  x: number
  y: number
  node: ObjectNode
}

interface AppProps {
  objectId: string
  objects?: { [id: string]: ObjectNode }
  showFilter?: boolean
  loadRelatedObjects: (objectId: string) => void
  removeRelatedObjects: (objectId: string) => void
  resetState: () => void
}

const App: React.FC<AppProps> = ({
  objectId,
  objects,
  showFilter = true,
  loadRelatedObjects,
  removeRelatedObjects,
  resetState,
}) => {
  const [filterCollapsed, setFilterCollapsed] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<{ [key: string]: boolean }>({})
  const [details, setDetails] = useState<Details | null>(null)

  // Load related objects on mount
  useEffect(() => {
    loadRelatedObjects(objectId)
  }, [objectId, loadRelatedObjects])

  // Reset state on unmount
  useEffect(() => {
    return () => {
      resetState()
    }
  }, [resetState])

  // Set initial selected types when objects are available
  useEffect(() => {
    if (Object.keys(selectedTypes).length === 0 && objects) {
      setInitialSelectedTypes(objects)
    }
  }, [objects, selectedTypes])

  const showDetailsHandler = (event: React.MouseEvent, node: ObjectNode) => {
    setDetails({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY, node })
  }

  const setInitialSelectedTypes = (objectsMap: { [id: string]: ObjectNode }) => {
    const availableObjectTypes: { [key: string]: boolean } = {}
    for (const obj of Object.values(objectsMap)) {
      if (obj.cached_object_type) {
        availableObjectTypes[obj.cached_object_type] = true
      }
    }
    setSelectedTypes(availableObjectTypes)
  }

  const convertObjectToNodes = (): [NodeWithLabel[], GraphLink[]] => {
    const nodes: { [id: string]: NodeWithLabel } = {}
    const links: GraphLink[] = []

    if (objects) {
      for (const node of Object.values(objects)) {
        const newNode: NodeWithLabel = {
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
  }

  const toggleFilter = () => {
    setFilterCollapsed(!filterCollapsed)
  }

  const updateSelectedTypes = (type: string) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  const availableObjectTypes = (): string[] => {
    if (!objects) return []
    return Object.values(objects)
      .map((obj) => obj.cached_object_type)
      .filter((elem, pos, arr) => arr.indexOf(elem) === pos)
  }

  const options = availableObjectTypes()
  const graphData = convertObjectToNodes()

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
            <JsonViewer data={details.node.payload as string | object | object[]} expanded={1} />
          </div>
        </div>
      )}
    </>
  )
}

export default App
