import React, { useState, useEffect, useRef, useCallback } from "react"

interface Project {
  id: string
  name: string
  description: string
  domain_id: string
  parent_id: string
}

interface HierarchicalProject {
  id: string
  name: string
  description: string
  domain_id: string
  parent_id: string
  children?: HierarchicalProject[]
}

interface ListProps {
  items?: Project[]
  isFetching?: boolean
  loadAuthProjectsOnce: () => void
  title?: string
  showCount?: boolean
  showSearchInput?: boolean
  root?: string
}

interface ExpandedLists {
  [key: string]: boolean
}

const List: React.FC<ListProps> = ({
  items = [],
  isFetching = false,
  loadAuthProjectsOnce,
  title = "Your Projects",
  showCount = true,
  showSearchInput: showSearchInputProp,
  root,
}) => {
  const [hierarchicalProjects, setHierarchicalProjects] = useState<HierarchicalProject[]>([])
  const [expandedLists, setExpandedLists] = useState<ExpandedLists>({})
  const [showSearchInput, setShowSearchInput] = useState(true)
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const buildHierarchy = useCallback(
    (projectItems: Project[]): HierarchicalProject[] => {
      const map: { [key: string]: HierarchicalProject } = {}
      for (const item of projectItems) {
        map[item.id] = {
          name: item.name,
          parent_id: item.parent_id,
          domain_id: item.domain_id,
          id: item.id,
          description: item.description,
        }
      }

      const rootProjects: HierarchicalProject[] = []

      for (const id in map) {
        const item = map[id]
        let parent: HierarchicalProject | undefined

        if (item.parent_id && item.parent_id !== item.domain_id) {
          parent = map[item.parent_id]
        }

        if (parent) {
          parent.children = parent.children || []
          parent.children.push(item)
        } else {
          rootProjects.push(item)
        }
      }

      if (root && map[root]) {
        return map[root].children || []
      }
      return rootProjects
    },
    [root]
  )

  // Load projects and initialize state
  useEffect(() => {
    loadAuthProjectsOnce()

    if (showSearchInputProp === false) {
      setShowSearchInput(false)
    }

    if (items && items.length > 0) {
      setHierarchicalProjects(buildHierarchy(items))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus search input when it becomes visible
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchInput])

  // Rebuild hierarchy when items change
  useEffect(() => {
    if (items && items.length > 0) {
      setHierarchicalProjects(buildHierarchy(items))
    }
  }, [items, buildHierarchy])

  const toggleSubtree = useCallback((itemId: string) => {
    setExpandedLists((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }, [])

  const toggleSearchInputHandler = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setShowSearchInput((prev) => !prev)
  }, [])

  const updateSearchTerm = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const clearSearchTerm = useCallback(() => {
    setSearchTerm(null)
  }, [])

  const renderHierarchy = useCallback(
    (projects: HierarchicalProject[]): (JSX.Element | null)[] => {
      const searchMode = searchTerm && searchTerm.length > 0

      return projects.map((project, index) => {
        const hasChildren = project.children && project.children.length > 0
        let children: (JSX.Element | null)[] | null = null
        if (hasChildren && project.children) {
          children = renderHierarchy(project.children).filter((child) => child !== null)
        }

        let labelClass: string | undefined
        if (
          searchMode &&
          searchTerm &&
          project.name.toLowerCase().indexOf(searchTerm.toLowerCase()) < 0 &&
          project.description.toLowerCase().indexOf(searchTerm.toLowerCase()) < 0
        ) {
          if (!hasChildren || (children && children.length === 0)) return null
          labelClass = "info-text"
        }

        let className = ""
        if (hasChildren) className += " has-children"
        if (expandedLists[project.id] || searchMode) className += " node-expanded"

        return (
          <li key={index} className={className}>
            <i className="node-icon" onClick={() => toggleSubtree(project.id)}></i>
            <a href={`/${project.domain_id}/${project.id}/home`} className={labelClass} title={project.description}>
              {project.name}
            </a>
            <span className="info-text small" style={{ paddingLeft: "5px" }}>
              {project.description}
            </span>
            {hasChildren && children && children.length > 0 && <ul>{children}</ul>}
          </li>
        )
      })
    },
    [searchTerm, expandedLists, toggleSubtree]
  )

  const searchEnabled = items && items.length > 10

  return (
    <>
      {title && (
        <h4 className="action-heading heading-top">
          {title}
          {showCount && items && items.length > 0 && ` (${items.length})`}
          {searchEnabled && (
            <div className="header-action">
              <i className="fa fa-search" onClick={toggleSearchInputHandler}></i>
            </div>
          )}
        </h4>
      )}

      {showSearchInput && searchEnabled && (
        <div className="toolbar-secondary">
          <div className="has-feedback">
            <input
              type="text"
              name="search-input"
              id="search-input"
              ref={searchInputRef}
              onChange={updateSearchTerm}
              value={searchTerm || ""}
              className="form-control"
              placeholder="Search name or description"
            />

            {searchTerm && searchTerm.length > 0 && (
              <span className="form-control-feedback not-empty">
                <i className="fa fa-times-circle" onClick={clearSearchTerm}></i>
              </span>
            )}
          </div>
        </div>
      )}

      {isFetching ? (
        <>
          <span className="spinner"></span> Loading...
        </>
      ) : hierarchicalProjects && hierarchicalProjects.length > 0 ? (
        <ul className={`tree tree-expandable`}>{renderHierarchy(hierarchicalProjects)}</ul>
      ) : (
        "None available."
      )}
    </>
  )
}

export default List
