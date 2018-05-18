/* eslint no-console:0 */
import { HashRouter, Route, Redirect } from 'react-router-dom'
import { withRouter } from 'react-router'

import Menu from '../containers/menu';
import CloudopsHome from './home'
import SearchRoutes from '../search/components/routes'
import RoleAssignmentRoutes from '../role_assignments/components/routes'

let Breadcrumb = (props) => {
  let label = ''
  if(props.location && props.location.pathname) {
    label = props.location.pathname
    if (label.startsWith('/')) label = label.substring(1)
    if (label.length==0) return null
    label = label.split('-').map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' ')
  }

  return(
    <div className="main-toolbar">
      <div className="container">
        <h1>
          <div className="page-title">
            <i className="fa fa-angle-right"></i>
            &nbsp;
            { label }
          </div>
        </h1>
      </div>
    </div>
  )
}

Breadcrumb = withRouter(Breadcrumb)


// render all components inside a hash router
export default (props) =>
  <HashRouter /*hashType="noslash"*/ >
    <React.Fragment>
      <Menu/>
      <Breadcrumb/>

      <div className="container">
        <Route exact path="/" render={ () => <Redirect to="/universal-search"/>}/>
        {/*<Route exact path="/" component={CloudopsHome}/> */}
        <RoleAssignmentRoutes/>
        <SearchRoutes/>
      </div>
    </React.Fragment>
  </HashRouter>
