import React, { useState } from "react"
import { BrowserRouter, Route } from "react-router-dom"
// @ts-expect-error - lib/widget doesn't have TypeScript types
import { widgetBasePath } from "lib/widget"
import EventList from "./components/EventList"
import ItemShow from "./components/ItemShow"

interface AppContentProps {
  props?: Record<string, unknown>
}

const baseName = widgetBasePath("maillog")

// This is your starting point of tour application
// see several examples in the exampleApp
const AppContent: React.FC<AppContentProps> = ({ props }) => {
  // State to hold the fetched data to share between EventList and ItemShow
  const [mailLogData, setMailLogData] = useState<any[]>([])

  return (
    <BrowserRouter basename={baseName}>
      <Route path="/" render={() => <EventList props={props} onDataFetched={setMailLogData} />} />
      <Route exact path="/:id/show" render={() => <ItemShow data={mailLogData} />} />
    </BrowserRouter>
  )
}

export default AppContent
