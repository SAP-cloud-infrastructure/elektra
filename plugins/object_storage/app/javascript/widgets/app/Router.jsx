import React from "react"
import PropTypes from "prop-types"
import { BrowserRouter, Route, Redirect, Switch } from "react-router-dom"

import ContainerProperties from "./components/containers/Properties"
import DeleteContainer from "./components/containers/Delete"
import EmptyContainer from "./components/containers/Empty"
import NewContainer from "./components/containers/New"
import ContainerAccessControl from "./components/containers/AccessControl"
import Containers from "./components/containers/List"
import Objects from "./components/objects/List"
import HowToEnable from "./components/app/HowToEnable"
import NoSwiftAccountAndAccountManagement from "./components/app/NoSwiftAccountAndAccountManagement"
import NoSwiftAccountBecauseNoQuota from "./components/app/NoSwiftAccountBecauseNoQuota"

import { useGlobalState } from "./StateProvider"
import useActions from "./hooks/useActions"

const Routes = ({ projectPath, resourcesPath }) => {
  const capabilities = useGlobalState("capabilities")
  const account = useGlobalState("account")
  const { loadCapabilitiesOnce, loadAccountMetadataOnce } = useActions()

  React.useEffect(() => {
    loadCapabilitiesOnce()
    loadAccountMetadataOnce()
  }, [])

  if (capabilities.isFetching || account.isFetching) {
    return (
      <div>
        <span className="spinner" />
        Loading...
      </div>
    )
  }

  if (!account.data || Object.keys(account.data).length === 0) {
    if (capabilities?.data?.swift?.allow_account_management) {
      return (
        <NoSwiftAccountBecauseNoQuota
          projectPath={projectPath}
          resourcesPath={resourcesPath}
        />
      )
    } else {
      return <NoSwiftAccountAndAccountManagement projectPath={projectPath} />
    }
  }

  return (
    <>
      {/* redirect root to shares tab */}
      <Route exact path="/">
        <Redirect to="/containers" />
      </Route>

      <Switch >
        <Route path="/containers/:name/objects/:objectPath?">
          <Objects />
        </Route>

        <Route path="/containers">
          <Containers />
          <Route exact path="/containers/new" component={NewContainer} />

          <Route
            exact
            path={`/containers/:name/properties`}
            render={() => <ContainerProperties />}
          />

          <Route
            exact
            path={`/containers/:name/delete`}
            component={DeleteContainer}
          />
          <Route
            exact
            path={`/containers/:name/access-control`}
            component={ContainerAccessControl}
          />
          <Route
            exact
            path={`/containers/:name/empty`}
            component={EmptyContainer}
          />
        </Route>
      </Switch>
    </>
  )
}

const Router = ({ baseName, projectPath, resourcesPath }) => (
  <BrowserRouter basename={baseName}>
    <Route exact path={`/how-to-enable`} component={HowToEnable} />

    {policy.isAllowed("object_storage:container_list") ? (
      <Routes projectPath={projectPath} resourcesPath={resourcesPath} />
    ) : (
      <HowToEnable projectPath={projectPath} />
    )}
  </BrowserRouter>
)

Router.propTypes = {
  baseName: PropTypes.string.isRequired,
  projectPath: PropTypes.string.isRequired,
  resourcesPath: PropTypes.string.isRequired,
}

export default Router
