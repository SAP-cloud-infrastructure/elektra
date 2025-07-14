import { HashRouter, Route, Redirect } from "react-router-dom"
import React from "react"
import Loader from "../containers/loader"
import AccountList from "../containers/accounts/list"
import AccountCreateModal from "../containers/accounts/create"
import AccountSubleaseTokenModal from "../containers/accounts/sublease"
import AccountUpstreamConfigModal from "../containers/accounts/upstream_config"
import GCPoliciesEditModal from "../containers/gc_policies/edit"
import TagPoliciesEditModal from "../containers/tag_policies/edit"
import RBACPoliciesEditModal from "../containers/rbac_policies/edit"
import ValidationRulesEditModal from "../containers/validation_rules/edit"
import RepositoryList from "../containers/repositories/list"
import ImageList from "../containers/images/list"
import ImageDetailsModal from "../containers/images/details"

const KeppelApp = (props) => {
  const { projectId, canEdit, isAdmin, hasExperimentalFeatures, dockerInfo } =
    props
  const rootProps = {
    projectID: projectId,
    canEdit,
    isAdmin,
    hasExperimentalFeatures,
    dockerInfo,
  }

  return (
    <Loader>
      <HashRouter>
        <div>
          {/* entry point */}
          <Route exact path="/" render={() => <Redirect to="/accounts" />} />

          {/* account list */}
          <Route
            path="/accounts"
            render={(props) => <AccountList {...rootProps} />}
          />
          {/* modal dialogs that are reached from <AccountList> */}
          {isAdmin && (
            <Route
              exact
              path="/accounts/new"
              render={(props) => (
                <AccountCreateModal {...props} {...rootProps} />
              )}
            />
          )}
          <Route
            exact
            path="/accounts/:account/access_policies"
            render={(props) => (
              <RBACPoliciesEditModal {...props} {...rootProps} />
            )}
          />
          <Route
            exact
            path="/accounts/:account/gc_policies"
            render={(props) => (
              <GCPoliciesEditModal {...props} {...rootProps} />
            )}
          />
          <Route
            exact
            path="/accounts/:account/tag_policies"
            render={(props) => (
              <TagPoliciesEditModal {...props} {...rootProps} />
            )}
          />
          <Route
            exact
            path="/accounts/:account/sublease"
            render={(props) => (
              <AccountSubleaseTokenModal {...props} {...rootProps} />
            )}
          />
          <Route
            exact
            path="/accounts/:account/upstream_config"
            render={(props) => (
              <AccountUpstreamConfigModal {...props} {...rootProps} />
            )}
          />
          <Route
            exact
            path="/accounts/:account/validation_rules"
            render={(props) => (
              <ValidationRulesEditModal {...props} {...rootProps} />
            )}
          />

          {/* repository list within account */}
          <Route
            path="/account/:account"
            render={(props) => <RepositoryList {...props} {...rootProps} />}
          />

          {/* manifest list within repository (this matches to much if we have a subpath behind the repo; this gets fixed in <ImageList>) */}
          <Route
            path="/repo/:account/:repo+"
            render={(props) => <ImageList {...props} {...rootProps} />}
          />
          {/* modal dialogs that are reached from <ImageList> */}
          <Route
            exact
            path="/repo/:account/:repo+/-/manifest/:digest/details"
            render={(props) => <ImageDetailsModal {...props} {...rootProps} />}
          />
        </div>
      </HashRouter>
    </Loader>
  )
}

export default KeppelApp
