import React from "react"
import { useHistory, useLocation } from "react-router-dom"
import {
  Tab,
  Tabs,
  TabPanel,
  TabList,
  Container,
} from "@cloudoperators/juno-ui-components"

const TabsComponent = ({ tabsConfig, ...otherProps }) => {
  const location = useLocation()
  const history = useHistory()

  const [nav, content, activeIndex] = React.useMemo(() => {
    let tabItems = []
    let tabPanels = []
    let activeIndex = 0
    for (let [i, tab] of tabsConfig.entries()) {
      if (location.pathname.indexOf(tab.to) === 0) activeIndex = i
      let Component = tab.component

      // collect tab items
      tabItems.push(
        <Tab key={i} onClick={() => history.push(tab.to)}>
          {tab.label}
        </Tab>
      )
      // collect tab panels
      tabPanels.push(
        <TabPanel key={i}>
          <Container px={false}>
            <Component>{otherProps}</Component>
          </Container>
        </TabPanel>
      )
    }
    return [tabItems, tabPanels, activeIndex]
  }, [location, history, tabsConfig])

  return (
    <Tabs defaultIndex={activeIndex}>
      <TabList>{nav}</TabList>

      {content}
    </Tabs>
  )
}

export default TabsComponent
