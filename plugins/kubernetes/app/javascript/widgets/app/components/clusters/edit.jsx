/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
import AdvancedOptions from "./advancedoptions"
import ReactModal from "../../lib/modal"
import ReactFormHelpers from "../../lib/form_helpers"

import { connect } from "react-redux"
import {
  updateClusterForm,
  closeClusterForm,
  addNodePool,
  deleteNodePool,
  updateNodePoolForm,
  submitClusterForm,
  requestDeleteCluster,
  toggleAdvancedOptions,
  updateSSHKey,
  updateKeyPair,
} from "../../actions"

class EditCluster extends React.Component {
  // find size status for pool with given name
  nodePoolStatusSize(cluster, poolName) {
    const pool = cluster.status.nodePools.filter((i) => i.name === poolName)[0]
    if (pool != null) {
      return pool.size
    } else {
      // if pool can't be found for some reason, err on the side of caution and pretend size is not zero so it won't get deleted by accident
      return 1
    }
  }

  render() {
    let keyPair, e, flavor
    const {
      close,
      clusterForm,
      metaData,
      info,
      handleSubmit,
      handleFormClose,
      handleChange,
      handleNodePoolChange,
      handleNodePoolAdd,
      handleNodePoolRemove,
      handleClusterDelete,
      handleAdvancedOptionsToggle,
      handleSSHKeyChange,
      handleKeyPairChange,
    } = this.props
    const cluster = clusterForm.data
    const { spec } = cluster

    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { className: "modal-body" },
        clusterForm.errors ? (
          <div className="alert alert-error">
            <ReactFormHelpers.Errors errors={clusterForm.errors} />
          </div>
        ) : undefined,
        React.createElement(
          "form",
          { className: "form form-horizontal" },
          // Name
          <div className="form-group string  cluster_name">
            <label className="string col-sm-4 control-label" htmlFor="name">
              Cluster Name
            </label>
            <div className="col-sm-8">
              <div className="input-wrapper">
                <input
                  className="string form-control disabled"
                  disabled="disabled"
                  type="text"
                  name="name"
                  value={cluster.name || ""}
                />
              </div>
            </div>
          </div>,

          // Keypair
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { className: "form-group required string" },
              <label
                className="string required col-sm-4 control-label"
                htmlFor="keypair"
              >
                {" "}
                Key Pair
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
                      name: "keypair",
                      className: "select form-control",
                      value: spec.keyPair || "",
                      onChange(e) {
                        return handleKeyPairChange(e.target.value)
                      },
                    },
                    metaData.keyPairs != null ? (
                      <optgroup label="Choose from personal keys or provide other">
                        <option value="">None</option>
                        {(() => {
                          const result = []
                          for (let keyPair of Array.from(metaData.keyPairs)) {
                            result.push(
                              <option
                                value={keyPair.publicKey}
                                key={keyPair.name}
                              >
                                {keyPair.name}
                              </option>
                            )
                          }
                          return result
                        })()}
                        <option value="other">Other</option>
                      </optgroup>
                    ) : (
                      <option value="">Loading...</option>
                    )
                  )
                )
              )
            )
          ),

          // SSH Public Key
          metaData.keyPairs != null && spec.keyPair === "other"
            ? React.createElement(
                "div",
                null,
                React.createElement(
                  "div",
                  { className: "form-group string" },
                  <label
                    className="string required col-sm-4 control-label"
                    htmlFor="sshkey"
                  >
                    {" "}
                    SSH Public Key
                  </label>,
                  React.createElement(
                    "div",
                    { className: "col-sm-8" },
                    React.createElement(
                      "div",
                      { className: "input-wrapper" },
                      React.createElement("textarea", {
                        name: "sshkey",
                        className: "form-control",
                        value: spec.sshPublicKey || "",
                        onChange(e) {
                          return handleSSHKeyChange(e.target.value)
                        },
                        rows: 6,
                        placeholder: "Please paste any valid SSH public key",
                      })
                    )
                  )
                )
              )
            : undefined,
          <p className="u-clearfix">
            <a
              className="pull-right"
              onClick={(e) => {
                e.preventDefault()
                return handleAdvancedOptionsToggle()
              }}
              href="#"
            >{`${
              clusterForm.advancedOptionsVisible ? "Hide " : ""
            }Advanced Options`}</a>
          </p>,
          clusterForm.advancedOptionsVisible ? (
            <AdvancedOptions
              clusterForm={clusterForm}
              metaData={metaData}
              info={info}
              edit={true}
            />
          ) : undefined
        ),

        // ------- NODEPOOLS --------

        <div className="toolbar">
          <h4>Nodepools</h4>
          <div className="main-buttons">
            {(() => {
              if (
                !metaData.loaded ||
                (metaData.error != null && metaData.errorCount <= 20)
              ) {
                return (
                  <button className="btn btn-default" disabled="disabled">
                    <span className="spinner" />
                  </button>
                )
              } else {
                const defaultAZName = metaData.availabilityZones[0].name
                return (
                  <button
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.preventDefault()
                      return handleNodePoolAdd(defaultAZName)
                    }}
                  >
                    Add Pool
                  </button>
                )
              }
            })()}
          </div>
        </div>,
        (() => {
          const result1 = []
          for (let index = 0; index < cluster.spec.nodePools.length; index++) {
            var nodePool = cluster.spec.nodePools[index]
            var poolStatusSize = this.nodePoolStatusSize(cluster, nodePool.name)

            result1.push(
              React.createElement(
                "div",
                { className: "nodepool-form", key: `nodepool-${index}` },
                React.createElement(
                  "form",
                  { className: "form form-inline form-inline-flex" },
                  <h5 className="title">{`Pool ${index + 1}:`}</h5>,
                  // Nodepool name
                  React.createElement(
                    "div",
                    { className: "form-group required string" },
                    <label
                      className="string required control-label"
                      htmlFor="name"
                    >
                      Name <abbr title="required">*</abbr>
                    </label>,
                    React.createElement("input", {
                      className: "string form-control",
                      "data-index": index,
                      disabled:
                        nodePool.name && !nodePool.new ? "disabled" : undefined,
                      type: "text",
                      name: "name",
                      placeholder: "a-z + 0-9",
                      value: nodePool.name || "",
                      onChange(e) {
                        e.preventDefault
                        return handleNodePoolChange(
                          e.target.dataset.index,
                          e.target.name,
                          e.target.value
                        )
                      },
                    })
                  ),

                  // Nodepool flavor
                  React.createElement(
                    "div",
                    { className: "form-group string" },
                    <label className="string control-label" htmlFor="flavor">
                      Flavor <abbr title="required">*</abbr>
                    </label>,
                    React.createElement(
                      "select",
                      {
                        name: "flavor",
                        "data-index": index,
                        className: "string form-control",
                        disabled:
                          nodePool.flavor && !nodePool.new
                            ? "disabled"
                            : undefined,
                        value: nodePool.flavor || "",
                        onChange(e) {
                          e.preventDefault
                          return handleNodePoolChange(
                            e.target.dataset.index,
                            e.target.name,
                            e.target.value
                          )
                        },
                      },
                      (() => {
                        if (
                          !metaData.loaded ||
                          (metaData.error != null && metaData.errorCount <= 20)
                        ) {
                          return <option value="">Loading...</option>
                        } else {
                          if (metaData.flavors != null) {
                            return (() => {
                              const result2 = []
                              for (
                                let f_index = 0;
                                f_index < metaData.flavors.length;
                                f_index++
                              ) {
                                flavor = metaData.flavors[f_index]
                                var flavorMetaData =
                                  flavor.ram != null && flavor.vcpus != null
                                    ? `(ram: ${flavor.ram}, vcpus: ${flavor.vcpus})`
                                    : ""
                                result2.push(
                                  <option
                                    value={flavor.name}
                                    key={f_index}
                                  >{`${flavor.name} ${flavorMetaData}`}</option>
                                )
                              }
                              return result2
                            })()
                          }
                        }
                      })()
                    )
                  ),

                  // Nodepool availability zone
                  React.createElement(
                    "div",
                    { className: "form-group string" },
                    <label className="string control-label" htmlFor="az">
                      Availability Zone <abbr title="required">*</abbr>
                    </label>,
                    React.createElement(
                      "select",
                      {
                        name: "availabilityZone",
                        "data-index": index,
                        className: "string form-control",
                        disabled:
                          nodePool.availabilityZone && !nodePool.new
                            ? "disabled"
                            : undefined,
                        value: nodePool.availabilityZone || "",
                        onChange(e) {
                          e.preventDefault
                          return handleNodePoolChange(
                            e.target.dataset.index,
                            e.target.name,
                            e.target.value
                          )
                        },
                      },
                      (() => {
                        if (
                          !metaData.loaded ||
                          (metaData.error != null && metaData.errorCount <= 20)
                        ) {
                          return <option value="">Loading...</option>
                        } else {
                          if (metaData.availabilityZones != null) {
                            return Array.from(metaData.availabilityZones).map(
                              (az) => (
                                <option
                                  value={az.name}
                                  key={az.name}
                                >{`${az.name}`}</option>
                              )
                            )
                          }
                        }
                      })()
                    )
                  ),

                  // Nodepool size
                  React.createElement(
                    "div",
                    { className: "form-group string form-group-size" },
                    <label className="string control-label" htmlFor="size">
                      Size <abbr title="required">*</abbr>
                    </label>,
                    React.createElement("input", {
                      className: "string form-control",
                      "data-index": index,
                      type: "number",
                      name: "size",
                      min: "0",
                      placeholder: "0",
                      value: isNaN(nodePool.size) ? "" : nodePool.size,
                      onChange(e) {
                        e.preventDefault
                        return handleNodePoolChange(
                          e.target.dataset.index,
                          e.target.name,
                          parseInt(e.target.value, 10)
                        )
                      },
                    })
                  ),

                  // Nodepool Allow Reboot
                  React.createElement(
                    "div",
                    { className: "checkbox inline-checkbox form-group" },
                    React.createElement(
                      "label",
                      { className: "string control-label" },
                      React.createElement("input", {
                        type: "checkbox",
                        "data-index": index,
                        checked: nodePool.config.allowReboot,
                        onChange(e) {
                          return handleNodePoolChange(
                            e.target.dataset.index,
                            "allowReboot",
                            e.target.checked
                          )
                        },
                      }),
                      "Allow Reboot"
                    )
                  ),

                  // Nodepool Allow Replace
                  React.createElement(
                    "div",
                    { className: "checkbox inline-checkbox form-group" },
                    React.createElement(
                      "label",
                      { className: "string control-label" },
                      React.createElement("input", {
                        type: "checkbox",
                        "data-index": index,
                        checked: nodePool.config.allowReplace,
                        onChange(e) {
                          return handleNodePoolChange(
                            e.target.dataset.index,
                            "allowReplace",
                            e.target.checked
                          )
                        },
                      }),
                      "Allow Replace"
                    )
                  ),
                  React.createElement(
                    "button",
                    {
                      className: "btn btn-default",
                      "data-index": index,
                      disabled:
                        !nodePool.new &&
                        (nodePool.size > 0 || poolStatusSize > 0)
                          ? "disabled"
                          : undefined,
                      onClick(e) {
                        e.preventDefault()
                        return handleNodePoolRemove(
                          e.currentTarget.dataset.index
                        )
                      },
                    },
                    <span
                      className={`fa ${
                        nodePool.new ||
                        (nodePool.size === 0 && poolStatusSize === 0)
                          ? "fa-trash"
                          : "fa-lock"
                      }`}
                    />
                  )
                )
              )
            )
          }
          return result1
        })()
      ),
      React.createElement(
        "div",
        { className: "modal-footer" },
        React.createElement(
          "button",
          {
            className: "btn btn-default hover-danger pull-left btn-icon-text",
            onClick(e) {
              e.preventDefault()
              close()
              return handleClusterDelete(cluster.name)
            },
          },
          <i className="fa fa-fw fa-trash-o" />,
          "Delete Cluster"
        ),
        React.createElement(
          "button",
          {
            role: "close",
            type: "button",
            className: "btn btn-default",
            onClick(e) {
              e.preventDefault()
              close()
              return handleFormClose()
            },
          },
          "Close"
        ),
        React.createElement(ReactFormHelpers.SubmitButton, {
          label: "Update",
          loading: clusterForm.isSubmitting,
          disabled: !(clusterForm.isValid && clusterForm.updatePending),
          onSubmit() {
            return handleSubmit(close)
          },
        })
      )
    )
  }
}

const EditClusterConnected = connect(
  (state) => ({
    clusterForm: state.clusterForm,
    metaData: state.metaData,
  }),
  (dispatch) => ({
    handleChange(name, value) {
      return dispatch(updateClusterForm(name, value))
    },
    handleAdvancedOptionsToggle() {
      return dispatch(toggleAdvancedOptions())
    },
    handleNodePoolChange(index, name, value) {
      return dispatch(updateNodePoolForm(index, name, value))
    },
    handleNodePoolAdd(defaultAZ) {
      return dispatch(addNodePool(defaultAZ))
    },
    handleNodePoolRemove(index) {
      return dispatch(deleteNodePool(index))
    },
    handleFormClose() {
      return dispatch(closeClusterForm())
    },
    handleSubmit(callback) {
      return dispatch(submitClusterForm(callback))
    },
    handleClusterDelete(clusterName) {
      return dispatch(requestDeleteCluster(clusterName))
    },
    handleSSHKeyChange(value) {
      return dispatch(updateSSHKey(value))
    },
    handleKeyPairChange(value) {
      return dispatch(updateKeyPair(value))
    },
  })
)(EditCluster)

const EditClusterModal = ReactModal.Wrapper(
  "Edit Cluster",
  EditClusterConnected,
  {
    xlarge: true,
    closeButton: false,
    static: true,
  }
)

export default EditClusterModal
