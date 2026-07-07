import React, { useState } from "react"
import { BrowserRouter, Route } from "react-router-dom"
import { Tabs, TabList, Tab, TabPanel } from "@cloudoperators/juno-ui-components"
// @ts-expect-error - lib/widget doesn't have TypeScript types
import { widgetBasePath } from "lib/widget"
import EventList from "./components/EventList"
import ItemShow from "./components/ItemShow"
import Setup from "./components/Setup"
import ErrorReport from "./components/ErrorReport"
import EmailIdentityDomains from "./components/EmailIdentityDomains"
import SuppressionList from "./components/SuppressionList"
import { MailLogEntry } from "./actions"

interface AppContentProps {
  props?: Record<string, unknown>
}

const baseName = widgetBasePath("email_service")

const TAB_SLUGS = ["setup", "error-report", "maillog", "email-identity-domains"]

const getInitialTab = (): number => {
  const hash = window.location.hash.replace("#", "")
  const idx = TAB_SLUGS.indexOf(hash)
  return idx >= 0 ? idx : 0
}

const AppContent: React.FC<AppContentProps> = ({ props }) => {
  const [mailLogData, setMailLogData] = useState<MailLogEntry[]>([])
  const [activeTab, setActiveTab] = useState<number>(getInitialTab)
  const [maillogMessageId, setMaillogMessageId] = useState<string | undefined>(undefined)

  const handleTabChange = (index: number) => {
    setActiveTab(index)
    window.location.hash = TAB_SLUGS[index]
  }

  const handleNavigateToMaillog = (messageId: string) => {
    setMaillogMessageId(messageId)
    setActiveTab(2)
    window.location.hash = TAB_SLUGS[2]
  }

  return (
    <Tabs selectedIndex={activeTab} onSelect={handleTabChange}>
      <TabList>
        <Tab>Setup</Tab>
        <Tab>Error Report</Tab>
        <Tab>Maillog</Tab>
        <Tab>Email Identity Domains</Tab>
      </TabList>
      <TabPanel>
        <Setup />
      </TabPanel>
      <TabPanel>
        <ErrorReport onNavigateToMaillog={handleNavigateToMaillog} />
      </TabPanel>
      <TabPanel>
        <BrowserRouter basename={baseName}>
          <Route path="/" render={() => <EventList props={props} onDataFetched={setMailLogData} initialMessageId={maillogMessageId} />} />
          <Route exact path="/:id/show" render={() => <ItemShow data={mailLogData} />} />
        </BrowserRouter>
      </TabPanel>
      <TabPanel>
        <EmailIdentityDomains />
      </TabPanel>
    </Tabs>
  )
}

export default AppContent
