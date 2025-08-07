/* eslint-disable react/no-children-prop */
/* eslint-disable no-undef */
/* eslint no-console:0 */
import { BrowserRouter, Route, Redirect } from "react-router-dom"
import React from "react"
import Tabs from "./tabs"

import Shares from "../containers/shares/list"
import EditShareModal from "../containers/shares/edit"
import EditShareSizeModal from "../containers/shares/edit_size"
import ShowShareModal from "../containers/shares/show"
import NewShareModal from "../containers/shares/new"
import AccessControlModal from "../containers/shares/access_control"
import ResetShareStatusModal from "../containers/shares/reset_status"
import RevertShareToSnapshotModal from "../containers/shares/revert_to_snapshot"

import Replicas from "../containers/replicas/list"
import ShowReplicaModal from "../containers/replicas/show"
import Snapshots from "../containers/snapshots/list"
import EditSnapshotModal from "../containers/snapshots/edit"
import ShowSnapshotModal from "../containers/snapshots/show"
import NewSnapshotModal from "../containers/snapshots/new"
import NewReplicaModal from "../containers/replicas/new"

import ShareNetworks from "../containers/share_networks/list"
import NewShareNetworkModal from "../containers/share_networks/new"
import ShowShareNetworkModal from "../containers/share_networks/show"
import EditShareNetworkModal from "../containers/share_networks/edit"
import ShareNetworkSecurityServicesModal from "../containers/share_networks/security_services"

import SecurityServices from "../containers/security_services/list"
import ShowSecurityServiceModal from "../containers/security_services/show"
import NewSecurityServiceModal from "../containers/security_services/new"
import EditSecurityServiceModal from "../containers/security_services/edit"

import CastellumTabs from "../containers/castellum/tabs"
import CastellumConfigurationEditModal from "../containers/castellum/configuration/edit"

import ErrorMessagesModal from "../containers/error_messages/list"

const tabsConfigDefault = [
  { to: "/shares", label: "Shares", component: Shares },
  { to: "/snapshots", label: "Snapshots", component: Snapshots },
  { to: "/replicas", label: "Replicas", component: Replicas },
  { to: "/share-networks", label: "Share Networks", component: ShareNetworks },
  {
    to: "/security-services",
    label: "Security Services",
    component: SecurityServices,
  },
]

const tabsConfigWithCastellum = [
  ...tabsConfigDefault,
  { to: "/autoscaling", label: "Autoscaling", component: CastellumTabs },
]

// render all components inside a hash router
const SharedFilesystemApp = (props) => {
  const { hasCastellum } = props
  const tabsConfig = hasCastellum ? tabsConfigWithCastellum : tabsConfigDefault

  return (
    <BrowserRouter basename={`${window.location.pathname}?r=`}>
      <div>
        {/* redirect root to shares tab */}
        {policy.isAllowed("shared_filesystem_storage:share_get") && (
          <Route exact path="/" render={() => <Redirect to="/shares" />} />
        )}
        <Route
          path="/:activeTab"
          children={({ match, location, history }) =>
            React.createElement(
              Tabs,
              Object.assign({}, { match, location, history, tabsConfig }, props)
            )
          }
        />

        {policy.isAllowed("shared_filesystem_storage:share_create") && (
          <Route exact path="/shares/new" component={NewShareModal} />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_get") && (
          <Route
            exact
            path="/:parent(shares|autoscaling)/:id/show"
            component={ShowShareModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_update") && (
          <>
            <Route
              exact
              path="/:parent(shares|autoscaling)/:id/edit"
              component={EditShareModal}
            />
            <Route
              exact
              path="/:parent(shares|autoscaling)/:id/edit-size"
              component={EditShareSizeModal}
            />
          </>
        )}
        {policy.isAllowed("shared_filesystem_storage:share_update") && (
          <Route
            exact
            path="/:parent(shares|autoscaling)/:id/access-control"
            component={AccessControlModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:snapshot_create") && (
          <Route
            exact
            path="/:parent(shares|autoscaling)/:id/snapshots/new"
            component={NewSnapshotModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:replica_create") && (
          <Route
            exact
            path="/:parent(shares)/:id/replicas/new"
            component={NewReplicaModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:replica_get") && (
          <Route exact path="/replicas/:id/show" component={ShowReplicaModal} />
        )}
        {policy.isAllowed("shared_filesystem_storage:snapshot_get") && (
          <Route
            exact
            path="/snapshots/:id/show"
            component={ShowSnapshotModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:snapshot_update") && (
          <Route
            exact
            path="/snapshots/:id/edit"
            component={EditSnapshotModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_reset_status") && (
          <Route
            exact
            path="/:parent(shares|autoscaling)/:id/reset-status"
            component={ResetShareStatusModal}
          />
        )}
        {policy.isAllowed(
          "shared_filesystem_storage:share_revert_to_snapshot"
        ) && (
          <Route
            exact
            path="/:parent(shares|autoscaling)/:id/revert-to-snapshot"
            component={RevertShareToSnapshotModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_network_create") && (
          <Route
            exact
            path="/share-networks/new"
            component={NewShareNetworkModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_network_get") && (
          <Route
            exact
            path="/share-networks/:id/show"
            component={ShowShareNetworkModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_network_update") && (
          <Route
            exact
            path="/share-networks/:id/edit"
            component={EditShareNetworkModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:share_network_update") && (
          <Route
            exact
            path="/share-networks/:id/security-services"
            component={ShareNetworkSecurityServicesModal}
          />
        )}

        {policy.isAllowed(
          "shared_filesystem_storage:security_service_create"
        ) && (
          <Route
            exact
            path="/security-services/new"
            component={NewSecurityServiceModal}
          />
        )}
        {policy.isAllowed("shared_filesystem_storage:security_service_get") && (
          <Route
            exact
            path="/security-services/:id/show"
            component={ShowSecurityServiceModal}
          />
        )}
        {policy.isAllowed(
          "shared_filesystem_storage:security_service_update"
        ) && (
          <Route
            exact
            path="/security-services/:id/edit"
            component={EditSecurityServiceModal}
          />
        )}

        <Route
          exact
          path="/:type/:id/error-log"
          component={ErrorMessagesModal}
        />

        {hasCastellum &&
          policy.isAllowed("shared_filesystem_storage:share_update") && (
            <Route
              exact
              path="/autoscaling/configure/:shareType"
              render={(routeProps) => (
                <CastellumConfigurationEditModal
                  {...routeProps}
                  projectID={props.projectId}
                />
              )}
            />
          )}
      </div>
    </BrowserRouter>
  )
}

export default SharedFilesystemApp
