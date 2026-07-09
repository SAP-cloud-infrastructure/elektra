import React, { useState } from "react"
import { MemoryRouter, Route } from "react-router-dom"
import { Tabs, TabList, Tab, TabPanel } from "@cloudoperators/juno-ui-components"
import { useQueryClient } from "@tanstack/react-query"
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

const baseName = widgetBasePath("email-service")

const TAB_SLUGS = ["setup", "error-report", "maillog", "email-identity-domains"]

const getInitialTab = (): number => {
  const hash = window.location.hash.replace("#", "").split("?")[0]
  const idx = TAB_SLUGS.indexOf(hash)
  return idx >= 0 ? idx : 0
}

const getInitialMessageId = (): string | undefined => {
  const params = new URLSearchParams(window.location.hash.split("?")[1] ?? "")
  return params.get("messageId") ?? undefined
}

const AppContent: React.FC<AppContentProps> = ({ props }) => {
  const [mailLogData, setMailLogData] = useState<MailLogEntry[]>([])
  const [activeTab, setActiveTab] = useState<number>(getInitialTab)
  const [maillogMessageId, setMaillogMessageId] = useState<string | undefined>(getInitialMessageId)
  const queryClient = useQueryClient()

  const handleTabChange = (index: number) => {
    setActiveTab(index)
    window.location.hash = TAB_SLUGS[index]
    if (index !== 2) setMaillogMessageId(undefined)
    if (index === 3) {
      queryClient.invalidateQueries({ queryKey: ["headerDomains"] })
      queryClient.invalidateQueries({ queryKey: ["dkim"] })
    }
    if (index === 2) {
      queryClient.invalidateQueries({ queryKey: ["data"] })
    }
  }

  const handleNavigateToMaillog = (messageId: string) => {
    setMaillogMessageId(messageId)
    setActiveTab(2)
    window.location.hash = `${TAB_SLUGS[2]}?messageId=${encodeURIComponent(messageId)}`
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
        <MemoryRouter>
          <Route path="/" render={() => <EventList props={props} onDataFetched={setMailLogData} initialMessageId={maillogMessageId} />} />
          <Route exact path="/:id/show" render={() => <ItemShow data={mailLogData} />} />
        </MemoryRouter>
      </TabPanel>
      <TabPanel>
        <EmailIdentityDomains />
      </TabPanel>
    </Tabs>
  )
}

export default AppContent
