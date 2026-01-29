import React from "react"
import EventList from "./components/EventList"

// This is your starting point of tour application
// see several examples in the exampleApp
const AppContent = ({props}) => {
  return (
    <>
      <EventList props={props}/>
    </>
  )
}

export default AppContent
