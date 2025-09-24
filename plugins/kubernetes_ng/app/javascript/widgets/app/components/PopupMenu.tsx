import React from "react"
import { PopupMenu as PopupMenuContainer, PopupMenuOptions } from "@cloudoperators/juno-ui-components"

// TODO temporary styles for popup menu button, to be replaced with juno class when available
const popupMenuButtonStyles = `
    juno-button
    juno-button-default
    juno-button-small-size
    jn-font-bold
    jn-inline-flex
    jn-justify-center
    jn-items-center
    jn-rounded
    jn-py-[0.3125rem]
    jn-px-[0.5rem]`

const PopupMenu = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string }) => {
  return (
    <PopupMenuContainer className={`popup-menu-container ${popupMenuButtonStyles} ${className}`} {...props}>
      <PopupMenuOptions>{children}</PopupMenuOptions>
    </PopupMenuContainer>
  )
}

export default PopupMenu
