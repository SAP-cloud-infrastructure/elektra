/* eslint no-console:0 */
import React from "react"
import PropTypes from "prop-types"
import StateProvider from "./StateProvider"
import Router from "./Router"

const App = (props) => (
  <StateProvider>
    <Router baseName={props.baseName} resourcesPath={props.resourcesPath} projectPath={props.projectPath} />
  </StateProvider>
)

App.propTypes = {
  baseName: PropTypes.string,
  projectPath: PropTypes.string,
  resourcesPath: PropTypes.string,
}

export default App
