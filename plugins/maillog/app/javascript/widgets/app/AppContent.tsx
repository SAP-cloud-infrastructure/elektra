import React from "react"
import EventList from "./components/EventList"

interface AppContentProps {
  props?: Record<string, unknown>
}

// This is your starting point of tour application
// see several examples in the exampleApp
const AppContent: React.FC<AppContentProps> = ({ props }) => {
  return (
    <>
      <EventList props={props} />
    </>
  )
}

export default AppContent
