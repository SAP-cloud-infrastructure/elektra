import React, { useState } from "react"
import { BrowserRouter, Route } from "react-router-dom"
import { Tabs, TabList, Tab, TabPanel } from "@cloudoperators/juno-ui-components"
// @ts-expect-error - lib/widget doesn't have TypeScript types
import { widgetBasePath } from "lib/widget"
import EventList from "./components/EventList"
import ItemShow from "./components/ItemShow"
import Setup from "./components/Setup"
import { MailLogEntry } from "./actions"

interface AppContentProps {
  props?: Record<string, unknown>
}

const baseName = widgetBasePath("email_service")

const AppContent: React.FC<AppContentProps> = ({ props }) => {
  const [mailLogData, setMailLogData] = useState<MailLogEntry[]>([])

  return (
    <Tabs>
      <TabList>
        <Tab>Setup</Tab>
        <Tab>Maillog</Tab>
      </TabList>
      <TabPanel>
        <Setup />
      </TabPanel>
      <TabPanel>
        <BrowserRouter basename={baseName}>
          <Route path="/" render={() => <EventList props={props} onDataFetched={setMailLogData} />} />
          <Route exact path="/:id/show" render={() => <ItemShow data={mailLogData} />} />
        </BrowserRouter>
      </TabPanel>
    </Tabs>
  )
}

export default AppContent
