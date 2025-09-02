/* eslint no-console:0 */
import React, { useCallback } from "react"
import { BrowserRouter, Route, Redirect } from "react-router-dom"

import Tabs from "./Tabs"
import Secrets from "./secrets/secrets"
import SecretDetails from "./secrets/secretDetails"
import NewSecret from "./secrets/newSecret"
import Containers from "./containers/containers"
import ContainerDetails from "./containers/containerDetails"
import NewContainer from "./containers/newContainer"
import Orders from "./orders/orders.jsx"
import OrderDetails from "./orders/orderDetails.jsx"
import NewOrder from "./orders/newOrder.jsx"
import { widgetBasePath } from "lib/widget"
import { Messages } from "@cloudoperators/juno-messages-provider"
import useStore from "../store"

const baseName = widgetBasePath("keymanagerng")

const AppRouter = () => {
  const showNewContainer = useStore(
    useCallback((state) => state.showNewContainer)
  )
  const showNewSecret = useStore(useCallback((state) => state.showNewSecret))
  const showNewOrder = useStore(useCallback((state) => state.showNewOrder))
  const tabsDisabled = showNewSecret || showNewContainer || showNewOrder ? true : false

  const tabsConfig = [
    {
      to: "/secrets",
      label: "Secrets",
      component: Secrets,
      disabled: tabsDisabled,
    },
    {
      to: "/containers",
      label: "Containers",
      component: Containers,
      disabled: tabsDisabled,
    },
    {
      to: "/orders",
      label: "Orders",
      component: Orders,
      disabled: tabsDisabled,
    },
  ]
  
  console.log("AppRouter tabsConfig:", tabsConfig) // Debug log
  
  return (
    <>
      <Messages />
      <BrowserRouter basename={baseName}>
        <Route exact path="/" render={() => <Redirect to="/secrets" />} />
        <Route path="/:activeTab">
          <Tabs tabsConfig={tabsConfig} />
        </Route>
        <Route exact path="/secrets/newSecret" component={NewSecret} />
        <Route exact path="/secrets/:id/show" component={SecretDetails} />
        <Route exact path="/containers/newContainer" component={NewContainer} />
        <Route exact path="/containers/:id/show" component={ContainerDetails} />
        <Route exact path="/orders/newOrder" component={NewOrder} />
        <Route exact path="/orders/:id/show" component={OrderDetails} />
      </BrowserRouter>
    </>
  )
}

export default AppRouter
