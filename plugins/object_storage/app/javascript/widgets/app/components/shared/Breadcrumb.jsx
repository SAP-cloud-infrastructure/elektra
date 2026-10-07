import React from "react"
import { useParams, useHistory, Link, useRouteMatch } from "react-router-dom"
import { Tooltip } from "lib/components/Overlay"
import useUrlParamEncoder from "../../hooks/useUrlParamEncoder"

const regex = new RegExp("(/*[^/]+/)", "g")

export const CopyIcon = () => {
  return (
    <Tooltip content="Copy to clipboard" placement="top">
      <i className="fa fa-clone" />
    </Tooltip>
  )
}

const Breadcrumb = ({ count }) => {
  let { url } = useRouteMatch()
  let { name, objectPath } = useParams()
  let history = useHistory()
  let objectsRoot = url.replace(/([^/])\/objects.*/, "$1/objects")

  const { value: currentPath, encode } = useUrlParamEncoder(objectPath)

  const items = React.useMemo(() => {
    let match = currentPath && currentPath.match(regex)
    if (!match) return []
    return match.map((i) => (i[i.length - 1] === "/" ? i.slice(0, -1) : i))
    //.concat(match.map((i) => (i[i.length - 1] === "/" ? i.slice(0, -1) : i)))

    //return currentPath.split("/").filter((p) => !!p && p !== "")
  }, [currentPath])
  const handleClick = React.useCallback((e, i) => {
    e.preventDefault()
    let newPath = items.slice(0, i).join("/")
    if (newPath.length > 0) newPath += "/"
    history.push(`${objectsRoot}/${encode(newPath)}`)
  })

  return (
    <div className="breadrumb-with-details">
      <div style={{ display: "flex" }}>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            {name ? (
              <Link to="/containers">All containers</Link>
            ) : (
              <>All containers</>
            )}
          </li>
          {name && (
            <li className="breadcrumb-item">
              {items.length === 0 ? (
                name && (
                  <>
                    <span className="fa fa-fw fa-hdd-o" title="Container" />{" "}
                    {name}
                  </>
                )
              ) : (
                <a href="#" onClick={(e) => handleClick(e, 0)}>
                  <span className="fa fa-fw fa-hdd-o" title="Container" />{" "}
                  {name}
                </a>
              )}
            </li>
          )}

          {items.map((p, i) => (
            <li className={`breadcrumb-item${i === items.length - 1 ? " active" : ""}`} key={i}>
              {i < items.length - 1 ? (
                <a href="#" onClick={(e) => handleClick(e, i + 1)}>
                  <span className="fa fa-fw fa-folder" title="Directory" />
                  {p}
                </a>
              ) : (
                <>
                  <span className="fa fa-fw fa-folder-open" title="Directory" />{" "}
                  {p}
                </>
              )}
            </li>
          ))}
        </ol>

        {items && items.length > 0 && (
          <small className="breadcrumb-copy-button blink">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigator.clipboard
                  .writeText(name + "/" + currentPath)
                  .then(() => console.info("copied"))
              }}
            >
              <CopyIcon />
            </a>
          </small>
        )}
      </div>
      {count !== undefined && <div className="details">#{count}</div>}
    </div>
  )
}

export default Breadcrumb
