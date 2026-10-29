import React from "react"
import ReactDOM from "react-dom"
import PropTypes from "prop-types"
import { usePopper } from "react-popper"

// Create a host div for popover
const contextMenuHost = document.createElement("div")
contextMenuHost.setAttribute("id", "context-menu-host")

// add contextMenuHost at the end of body after the page has been loaded
window.addEventListener("load", () => document.body.append(contextMenuHost))

const ContextMenu = ({ children, disabled }) => {
  const [show, setShow] = React.useState(false)
  const wrapperRef = React.useRef()
  const [referenceElement, setReferenceElement] = React.useState(null)
  const [popperElement, setPopperElement] = React.useState(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement)

  // detect clicks outside of this element.
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target)) {
        setShow(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [wrapperRef.current])

  // we use the dropdown menu from bootstrap.
  // To avoid problems in overflow hidden elements
  // we use the portal feature of react and host the popover
  // container outside of relative elements
  return (
    <div ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        ref={setReferenceElement}
        className="btn btn-sm btn-secondary"
        data-test="dropdown"
        onClick={() => {
          setShow(!show)
        }}
      >
        <span className="fa fa-cog" />
      </button>
      {show &&
        ReactDOM.createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <ul className="dropdown-menu show super-colors">
              {React.Children.map(children, (child) =>
                React.isValidElement(child) &&
                child.type.displayName === "ContextMenu.Item"
                  ? React.cloneElement(child, {
                      hideMenu: () => setShow(false),
                    })
                  : child.type.displayName === "ContextMenu.Divider"
                  ? React.cloneElement(child)
                  : null
              )}
            </ul>
          </div>,
          contextMenuHost
        )}
    </div>
  )
}

ContextMenu.propTypes = {
  children: PropTypes.any,
  disabled: PropTypes.bool,
}

const Item = ({ className, onClick, children, hideMenu, disabled }) => (
  <li className={`${disabled ? "disabled" : ""} ${className || ""}`}>
    {onClick ? (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onClick(e)
          hideMenu()
        }}
      >
        {children}
      </a>
    ) : (
      children
    )}
  </li>
)

Item.displayName = "ContextMenu.Item"

Item.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
  onClick: PropTypes.func,
  hideMenu: PropTypes.func,
  disabled: PropTypes.bool,
}

const Divider = () => <li role="separator" className="divider" />
Divider.displayName = "ContextMenu.Divider"

ContextMenu.Item = Item
ContextMenu.Divider = Divider

export default ContextMenu
