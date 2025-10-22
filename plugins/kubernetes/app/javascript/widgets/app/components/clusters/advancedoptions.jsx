/* eslint-disable react/no-unescaped-entities */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import ReactHelpers from "../../lib/helpers"
import React from "react"
import { connect } from "react-redux"
import { updateAdvancedOptions, changeVersion } from "../../actions/clusters"

let AdvancedOptions = function ({
  clusterForm,
  metaData,
  info,
  handleChange,
  handleVersionChange,
  edit,
}) {
  let i

  const isValidVersion = function (currentVersion, newVersion) {
    // if we are not in the edit case there are no rules for which versions are valid, we get the acceptable ones from info.supportedClusterVersions
    if (!edit) {
      return true
    }

    if (!currentVersion) return true

    const currentNumbers = currentVersion.split(".").map((n) => Math.trunc(n))
    const newNumbers = newVersion.split(".").map((n) => Math.trunc(n))

    // ensure that major version matches and that new minor version is either equal or exactly 1 greater than current minor version
    return (
      newNumbers[0] === currentNumbers[0] &&
      (newNumbers[1] === currentNumbers[1] ||
        newNumbers[1] === currentNumbers[1] + 1)
    )
  }

  // available versions are different for edit and new case. Filter versions so that only valid versions as per the rules are left
  const availableVersions = function (currentVersion) {
    const versions = edit
      ? info.availableClusterVersions
      : info.supportedClusterVersions

    // filter and sort versions in descending order
    return versions
      .filter((v) => isValidVersion(currentVersion, v))
      .sort()
      .reverse()
  }

  const cluster = clusterForm.data
  const { spec } = cluster
  const options = cluster.spec.openstack

  return (
    <div>
      {(() => {
        if (!metaData.loaded || metaData.error != null) {
          if (metaData.error != null && metaData.errorCount > 20) {
            return (
              <div className="alert alert-warning">
                We couldn't retrieve the advanced options at this time, please
                try again later
              </div>
            )
          } else {
            return (
              <div className="u-clearfix">
                <div className="pull-right">
                  Loading options <span className="spinner" />
                </div>
              </div>
            )
          }
        } else {
          let selectedNetwork
          const selectedRouterIndex = ReactHelpers.findIndexInArray(
            metaData.routers,
            options.routerID,
            "id"
          )
          const selectedRouter = metaData.routers[selectedRouterIndex]
          if (selectedRouter != null) {
            const selectedNetworkIndex = ReactHelpers.findIndexInArray(
              selectedRouter.networks,
              options.networkID,
              "id"
            )
            selectedNetwork = selectedRouter.networks[selectedNetworkIndex]
          }

          return (
            <div>
              {metaData.securityGroups != null
                ? // SecurityGroups
                  React.createElement(
                    "div",
                    null,
                    React.createElement(
                      "div",
                      { className: "form-group required string" },
                      <label
                        className="string required col-sm-4 control-label"
                        htmlFor="securityGroupName"
                      >
                        <abbr title="required">*</abbr> Security Group
                      </label>,
                      React.createElement(
                        "div",
                        { className: "col-sm-8" },
                        React.createElement(
                          "div",
                          { className: "input-wrapper" },
                          React.createElement(
                            "select",
                            {
                              name: "securityGroupName",
                              className: "select required form-control",
                              value: options.securityGroupName || "",
                              disabled:
                                metaData.securityGroups.length === 1
                                  ? "disabled"
                                  : undefined,
                              onChange(e) {
                                return handleChange(
                                  e.target.name,
                                  e.target.value
                                )
                              },
                            },
                            (() => {
                              const result = []
                              for (
                                let i = 0;
                                i < metaData.securityGroups.length;
                                i++
                              ) {
                                var securityGroup = metaData.securityGroups[i]
                                result.push(
                                  <option value={securityGroup.name} key={i}>
                                    {securityGroup.name}
                                  </option>
                                )
                              }
                              return result
                            })()
                          )
                        )
                      )
                    )
                  )
                : undefined}
              {metaData.routers != null // TODO: Think about how to do this in the edit case if metadata empty or incomplete but there is a value set in the cluster spec, probably just display id without name
                ? // Router
                  React.createElement(
                    "div",
                    { className: "form-group required string" },
                    <label
                      className="string required col-sm-4 control-label"
                      htmlFor="routerID"
                    >
                      <abbr title="required">*</abbr> Router
                    </label>,
                    React.createElement(
                      "div",
                      { className: "col-sm-8" },
                      React.createElement(
                        "div",
                        { className: "input-wrapper" },
                        React.createElement(
                          "select",
                          {
                            name: "routerID",
                            className: "select required form-control",
                            value: options.routerID || "",
                            disabled:
                              metaData.routers.length === 1 || edit
                                ? "disabled"
                                : undefined,
                            onChange(e) {
                              return handleChange(e.target.name, e.target.value)
                            },
                          },
                          (() => {
                            const result1 = []
                            for (let i = 0; i < metaData.routers.length; i++) {
                              var router = metaData.routers[i]
                              result1.push(
                                <option value={router.id} key={i}>
                                  {router.name}
                                </option>
                              )
                            }
                            return result1
                          })()
                        )
                      )
                    )
                  )
                : undefined}
              {
                // Network
                options.routerID != null &&
                selectedRouter != null &&
                selectedRouter.networks != null
                  ? React.createElement(
                      "div",
                      { className: "form-group required string" },
                      <label
                        className="string required col-sm-4 control-label"
                        htmlFor="networkID"
                      >
                        <abbr title="required">*</abbr> Network
                      </label>,
                      React.createElement(
                        "div",
                        { className: "col-sm-8" },
                        React.createElement(
                          "div",
                          { className: "input-wrapper" },
                          React.createElement(
                            "select",
                            {
                              name: "networkID",
                              className: "select required form-control",
                              value: options.networkID || "",
                              disabled:
                                selectedRouter.networks.length === 1 || edit
                                  ? "disabled"
                                  : undefined,
                              onChange(e) {
                                return handleChange(
                                  e.target.name,
                                  e.target.value
                                )
                              },
                            },
                            (() => {
                              const result2 = []
                              for (
                                let i = 0;
                                i < selectedRouter.networks.length;
                                i++
                              ) {
                                var network = selectedRouter.networks[i]
                                result2.push(
                                  <option value={network.id} key={i}>
                                    {network.name}
                                  </option>
                                )
                              }
                              return result2
                            })()
                          )
                        )
                      )
                    )
                  : undefined
              }
              {
                // Subnet
                options.lbSubnetID != null &&
                selectedNetwork != null &&
                selectedNetwork.subnets != null
                  ? React.createElement(
                      "div",
                      { className: "form-group required string" },
                      <label
                        className="string required col-sm-4 control-label"
                        htmlFor="subnetID"
                      >
                        <abbr title="required">*</abbr> Subnet
                      </label>,
                      React.createElement(
                        "div",
                        { className: "col-sm-8" },
                        React.createElement(
                          "div",
                          { className: "input-wrapper" },
                          React.createElement(
                            "select",
                            {
                              name: "lbSubnetID",
                              className: "select required form-control",
                              value: options.lbSubnetID || "",
                              disabled:
                                selectedNetwork.subnets.length === 1 || edit
                                  ? "disabled"
                                  : undefined,
                              onChange(e) {
                                return handleChange(
                                  e.target.name,
                                  e.target.value
                                )
                              },
                            },
                            (() => {
                              const result3 = []
                              for (
                                let i = 0;
                                i < selectedNetwork.subnets.length;
                                i++
                              ) {
                                var subnet = selectedNetwork.subnets[i]
                                result3.push(
                                  <option value={subnet.id} key={i}>
                                    {subnet.name}
                                  </option>
                                )
                              }
                              return result3
                            })()
                          )
                        )
                      )
                    )
                  : undefined
              }
            </div>
          )
        }
      })()}
      <div className="form-group required string">
        <label
          className="string col-sm-4 control-label"
          htmlFor="securityGroupName"
        >
          {" "}
          Kubernetes Version
        </label>
        <div className="col-sm-8">
          {!info.loaded ? (
            <div className="u-clearfix">
              <div className="pull-right">
                Loading versions <span className="spinner" />
              </div>
            </div>
          ) : (
            <div className="input-wrapper">
              <select
                name="version"
                className="select form-control"
                value={
                  spec.version ||
                  cluster.status.apiserverVersion ||
                  info.defaultClusterVersion
                }
                onChange={(e) => handleVersionChange(e.target.value)}
              >
                {Array.from(
                  availableVersions(cluster.status.apiserverVersion)
                ).map((version) => (
                  <option value={version} key={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

AdvancedOptions = connect(
  (state) => ({
    clusterForm: state.clusterForm,
    metaData: state.metaData,
    info: state.info,
  }),
  (dispatch) => ({
    handleChange(name, value) {
      return dispatch(updateAdvancedOptions(name, value))
    },
    handleVersionChange(value) {
      return dispatch(changeVersion(value))
    },
  })
)(AdvancedOptions)

export default AdvancedOptions
