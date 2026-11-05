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
    const {
      close,
      clusterForm,
      metaData,
      info,
      handleSubmit,
      handleFormClose,
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

    const metaLoading = !metaData.loaded || (metaData.error != null && metaData.errorCount <= 20)

    return (
      <div>
        <div className="modal-body">
          {clusterForm.errors ? (
            <div className="alert alert-error">
              <ReactFormHelpers.Errors errors={clusterForm.errors} />
            </div>
          ) : undefined}

          <form className="form form-horizontal">
            {/* Name */}
            <div className="mb-3 string cluster_name">
              <label className="string col-sm-4 col-form-label pe-3" htmlFor="name">
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
            </div>

            {/* Key Pair */}

            <div className="mb-3 required string">
              <label className="string required col-sm-4 col-form-label pe-3" htmlFor="keypair">
                Key Pair
              </label>
              <div className="col-sm-8">
                <div className="input-wrapper">
                  <select
                    name="keypair"
                    className="select form-control"
                    value={spec.keyPair || ""}
                    onChange={(e) => handleKeyPairChange(e.target.value)}
                  >
                    {metaData.keyPairs != null ? (
                      <optgroup label="Choose from personal keys or provide other">
                        <option value="">None</option>
                        {Array.from(metaData.keyPairs).map((keyPair) => (
                          <option value={keyPair.publicKey} key={keyPair.name}>
                            {keyPair.name}
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </optgroup>
                    ) : (
                      <option value="">Loading...</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* SSH Public Key (only when keyPair === "other") */}
            {metaData.keyPairs != null && spec.keyPair === "other" ? (
              <div className="mb-3 string">
                <label className="string required col-sm-4 col-form-label" htmlFor="sshkey">
                  {" "}
                  SSH Public Key
                </label>
                <div className="col-sm-8">
                  <div className="input-wrapper">
                    <textarea
                      name="sshkey"
                      className="form-control"
                      value={spec.sshPublicKey || ""}
                      onChange={(e) => handleSSHKeyChange(e.target.value)}
                      rows={6}
                      placeholder="Please paste any valid SSH public key"
                    />
                  </div>
                </div>
              </div>
            ) : undefined}

            <p className="u-clearfix">
              <a
                className="float-end"
                onClick={(e) => {
                  e.preventDefault()
                  return handleAdvancedOptionsToggle()
                }}
                href="#"
              >
                {`${clusterForm.advancedOptionsVisible ? "Hide " : ""}Advanced Options`}
              </a>
            </p>

            {clusterForm.advancedOptionsVisible ? (
              <AdvancedOptions clusterForm={clusterForm} metaData={metaData} info={info} edit={true} />
            ) : undefined}
          </form>

          {/* ------- NODEPOOLS -------- */}
          <div className="toolbar">
            <h4>Nodepools</h4>
            <div className="main-buttons">
              {metaLoading ? (
                <button className="btn btn-secondary" disabled="disabled">
                  <span className="spinner" />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    return handleNodePoolAdd(metaData.availabilityZones[0].name)
                  }}
                >
                  Add Pool
                </button>
              )}
            </div>
          </div>

          {cluster.spec.nodePools.map((nodePool, index) => {
            const poolStatusSize = this.nodePoolStatusSize(cluster, nodePool.name)
            const canRemove = nodePool.new || (nodePool.size === 0 && poolStatusSize === 0)

            return (
              <div className="nodepool-form" key={`nodepool-${index}`}>
                <form className="form form-inline form-inline-flex justify-content-between">
                  <h5 className="title">{`Pool ${index + 1}:`}</h5>

                  {/* Nodepool name */}
                  <div className="required string">
                    <label className="string required col-form-label" htmlFor="name">
                      Name <abbr title="required">*</abbr>
                    </label>
                    <input
                      className="string form-control"
                      data-index={index}
                      disabled={nodePool.name && !nodePool.new ? "disabled" : undefined}
                      type="text"
                      name="name"
                      placeholder="a-z + 0-9"
                      value={nodePool.name || ""}
                      onChange={(e) => handleNodePoolChange(e.target.dataset.index, e.target.name, e.target.value)}
                    />
                  </div>

                  {/* Nodepool flavor */}
                  <div className="string">
                    <label className="string col-form-label" htmlFor="flavor">
                      Flavor <abbr title="required">*</abbr>
                    </label>
                    <select
                      name="flavor"
                      data-index={index}
                      className="string form-control"
                      disabled={nodePool.flavor && !nodePool.new ? "disabled" : undefined}
                      value={nodePool.flavor || ""}
                      onChange={(e) => handleNodePoolChange(e.target.dataset.index, e.target.name, e.target.value)}
                    >
                      {metaLoading || metaData.flavors == null ? (
                        <option value="">Loading...</option>
                      ) : (
                        metaData.flavors.map((flavor, f_index) => {
                          const flavorMetaData =
                            flavor.ram != null && flavor.vcpus != null
                              ? `(ram: ${flavor.ram}, vcpus: ${flavor.vcpus})`
                              : ""
                          return (
                            <option value={flavor.name} key={f_index}>
                              {`${flavor.name} ${flavorMetaData}`}
                            </option>
                          )
                        })
                      )}
                    </select>
                  </div>

                  {/* Nodepool availability zone */}
                  <div className="string">
                    <label className="string col-form-label" htmlFor="az">
                      Availability Zone <abbr title="required">*</abbr>
                    </label>
                    <select
                      name="availabilityZone"
                      data-index={index}
                      className="string form-control"
                      disabled={nodePool.availabilityZone && !nodePool.new ? "disabled" : undefined}
                      value={nodePool.availabilityZone || ""}
                      onChange={(e) => handleNodePoolChange(e.target.dataset.index, e.target.name, e.target.value)}
                    >
                      {metaLoading || metaData.availabilityZones == null ? (
                        <option value="">Loading...</option>
                      ) : (
                        Array.from(metaData.availabilityZones).map((az) => (
                          <option value={az.name} key={az.name}>
                            {`${az.name}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Nodepool size */}
                  <div className="string form-group-size">
                    <label className="string col-form-label" htmlFor="size">
                      Size <abbr title="required">*</abbr>
                    </label>
                    <input
                      className="string form-control"
                      data-index={index}
                      type="number"
                      name="size"
                      min="0"
                      placeholder="0"
                      value={isNaN(nodePool.size) ? "" : nodePool.size}
                      onChange={(e) =>
                        handleNodePoolChange(e.target.dataset.index, e.target.name, parseInt(e.target.value, 10))
                      }
                    />
                  </div>

                  {/* Allow Reboot */}
                  <div className="inline-checkbox">
                    <label className="string col-form-label">
                      <input
                        type="checkbox"
                        data-index={index}
                        checked={nodePool.config.allowReboot}
                        onChange={(e) => handleNodePoolChange(e.target.dataset.index, "allowReboot", e.target.checked)}
                      />
                      Allow Reboot
                    </label>
                  </div>

                  {/* Allow Replace */}
                  <div className="inline-checkbox">
                    <label className="string col-form-label">
                      <input
                        type="checkbox"
                        data-index={index}
                        checked={nodePool.config.allowReplace}
                        onChange={(e) => handleNodePoolChange(e.target.dataset.index, "allowReplace", e.target.checked)}
                      />
                      Allow Replace
                    </label>
                  </div>

                  <button
                    className="btn btn-secondary"
                    data-index={index}
                    disabled={!nodePool.new && (nodePool.size > 0 || poolStatusSize > 0) ? "disabled" : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      return handleNodePoolRemove(e.currentTarget.dataset.index)
                    }}
                  >
                    <span className={`fa ${canRemove ? "fa-trash" : "fa-lock"}`} />
                  </button>
                </form>
              </div>
            )
          })}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary hover-danger float-start btn-icon-text"
            onClick={(e) => {
              e.preventDefault()
              close()
              return handleClusterDelete(cluster.name)
            }}
          >
            <i className="fa fa-fw fa-trash-o" />
            Delete Cluster
          </button>
          <button
            role="close"
            type="button"
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault()
              close()
              return handleFormClose()
            }}
          >
            Close
          </button>
          <ReactFormHelpers.SubmitButton
            label="Update"
            loading={clusterForm.isSubmitting}
            disabled={!(clusterForm.isValid && clusterForm.updatePending)}
            onSubmit={() => handleSubmit(close)}
          />
        </div>
      </div>
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

const EditClusterModal = ReactModal.Wrapper("Edit Cluster", EditClusterConnected, {
  xlarge: true,
  closeButton: false,
  static: true,
})

export default EditClusterModal
