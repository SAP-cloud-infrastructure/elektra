import React, { useState, useEffect } from "react"
import uniqueId from "lodash/uniqueId"

// Custom Bootstrap Dropdown
// This dropdown is made to be used in scroll containers where the dropdown menu
// can be clipped. When clicking the dropdown menu in a scroll container the position
// is being calculated to expand the scroll container in case the menu is clipped.
const DropDownMenu = ({ buttonIcon, children }) => {
  const [componentID, setcomponentID] = useState(null)

  useEffect(() => {
    if (componentID) {
      var $component = $("#" + componentID)
      var $table = $component.closest(".table-responsive"),
        $menu = $component.find(".dropdown-menu")

      if ($table) {
        // add padding and animation on open dropdown
        $component.on("show.bs.dropdown", function () {
          var tableOffsetHeight = $table.offset().top + $table.height(),
            menuOffsetHeight =
              $component.offset().top +
              $component.outerHeight(true) +
              $menu.outerHeight(true)

          if (menuOffsetHeight > tableOffsetHeight) {
            var padding = menuOffsetHeight - tableOffsetHeight
            var scrollTarget = $table.scrollTop() + padding
            $table.css("padding-bottom", padding)
            $table.animate(
              {
                scrollTop: scrollTarget,
              },
              500
            )
          }
        })

        // remove padding on close dropdown
        $component.on("hide.bs.dropdown", function () {
          $table.css("padding-bottom", 0)
        })

        // clean up
        return () => {
          $component.off()
        }
      }
    }
  }, [componentID])

  useEffect(() => {
    const cpID = uniqueId("drop-down-menu")
    setcomponentID(cpID)
  }, [])

  return (
    <>
      <div className="btn-group custom-dropdown" id={componentID}>
        <button
          className="btn btn-default btn-sm dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-expanded={true}
        >
          {buttonIcon}
        </button>
        <ul className="dropdown-menu dropdown-menu-right" role="menu">
          {children}
        </ul>
      </div>
    </>
  )
}

export default DropDownMenu
