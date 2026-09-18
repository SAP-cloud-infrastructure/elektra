import React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"

export const ReactTransitionGroups = {}

const Fade = ({ children }) =>
  React.createElement(
    TransitionGroup,
    null,
    React.createElement(
      CSSTransition,
      {
        classNames: "css-transition-fade",
        timeout: { enter: 500, exit: 300 },
      },
      children
    )
  )

ReactTransitionGroups.Fade = Fade

export default ReactTransitionGroups
