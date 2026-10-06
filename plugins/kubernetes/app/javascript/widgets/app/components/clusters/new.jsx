/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
import ReactFormHelpers from "../../lib/form_helpers"
import ReactModal from "../../lib/modal"
import { connect } from "react-redux"
import { validateName, validateNodePoolName } from "../../reducers/cluster_form"
import { changeVersion } from "../../actions/clusters"

import {
  updateClusterForm,
  addNodePool,
  deleteNodePool,
  updateNodePoolForm,
  submitClusterForm,
  toggleAdvancedOptions,
  updateSSHKey,
  updateKeyPair,
} from "../../actions"

import AdvancedOptions from "./advancedoptions"

let NewCluster = ({
  close,
  clusterForm,
  metaData,
  info,
  handleSubmit,
  handleChange,
  handleNodePoolChange,
  handleNodePoolAdd,
  handleNodePoolRemove,
  handleAdvancedOptionsToggle,
  handleSSHKeyChange,
  handleKeyPairChange,
  updateVersion,
}) => {
  const [defaultAZName, setDefaultAZName] = React.useState()

  const onChange = React.useCallback(
    (e) => {
      e.preventDefault()
      return handleChange(e.target.name, e.target.value)
    },
    [handleChange]
  )

  const cluster = clusterForm.data
  const { spec } = cluster

  React.useEffect(() => {
    if (metaData.loaded) {
      setDefaultAZName(metaData.availabilityZones[0].name)
      cluster.spec.nodePools.forEach((_, index) => {
        handleNodePoolChange(
          index,
          "availabilityZone",
          metaData?.availabilityZones?.[0]?.name
        )
      })
      if (info.supportedClusterVersions?.length > 0) {
        updateVersion(info.supportedClusterVersions.sort().reverse()[0])
      }
    }
  }, [metaData.loaded])

  return (
    <div>
      <div className="modal-body">
        {clusterForm.errors && (
          <div className="alert alert-error">
            <ReactFormHelpers.Errors errors={clusterForm.errors} />
          </div>
        )}

        <form className="form form-horizontal">
          <div
            className={`form-group required string cluster_name ${
              !validateName(cluster.name) && "has-error"
            }`}
          >
            <label
              className="string required col-sm-4 control-label"
              htmlFor="name"
            >
              <abbr title="required">*</abbr> Cluster Name
            </label>
            <div className="col-sm-8">
              <div className="input-wrapper">
                <input
                  className="string required form-control"
                  type="text"
                  name="name"
                  placeholder="lower case letters and numbers"
                  value={cluster.name || ""}
                  onChange={onChange}
                />
                {!validateName(cluster.name) && (
                  <p className="help-block">
                    Name should start with a lowercase letter and can contain
                    lowercase letters, numbers, and hyphens. It must end with a
                    lowercase letter or number.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="form-group string">
              <label
                className="string col-sm-4 control-label"
                htmlFor="keypair"
              >
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
          </div>
          {/* SSH Public Key */}
          {metaData.keyPairs != null && spec.keyPair === "other" && (
            <div>
              <div className="form-group required string">
                <label
                  className="string required col-sm-4 control-label"
                  htmlFor="sshkey"
                >
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
            </div>
          )}
          <p className="u-clearfix">
            <a
              className="pull-right"
              onClick={(e) => {
                e.preventDefault()
                return handleAdvancedOptionsToggle()
              }}
              href="#"
            >
              {clusterForm.advancedOptionsVisible ? "Hide " : ""}
              Advanced Options
            </a>
          </p>
          {clusterForm.advancedOptionsVisible && (
            <AdvancedOptions
              clusterForm={clusterForm}
              metaData={metaData}
              info={info}
            />
          )}
        </form>
        {/* ------- NODEPOOLS -------- */}

        <div className="toolbar">
          <h4>Nodepools</h4>
          <div className="main-buttons">
            {!metaData.loaded ||
            (metaData.error != null && metaData.errorCount <= 20) ? (
              <button className="btn btn-secondary" disabled="disabled">
                <span className="spinner" />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault()
                  return handleNodePoolAdd(defaultAZName)
                }}
              >
                Add Pool
              </button>
            )}
          </div>
        </div>
        {Array.from(cluster.spec.nodePools).map((nodePool, i) => (
          <div className="nodepool-form" key={`nodepool-${i}`}>
            <form className="form form-inline form-inline-flex">
              <h5 className="title">{`Pool ${i + 1}:`}</h5>

              {/* Nodepool name */}
              <div className="form-group required string">
                <label className="string required control-label" htmlFor="name">
                  Name <abbr title="required">*</abbr>
                </label>
                <input
                  className="string form-control"
                  data-index={i}
                  type="text"
                  name="name"
                  placeholder="a-z + 0-9"
                  value={nodePool.name || ""}
                  onChange={(e) => {
                    e.preventDefault
                    return handleNodePoolChange(
                      e.target.dataset.index,
                      e.target.name,
                      e.target.value
                    )
                  }}
                />
              </div>

              {/* Nodepool flavor */}
              <div className="form-group string">
                <label className="string control-label" htmlFor="flavor">
                  Flavor <abbr title="required">*</abbr>
                </label>
                <select
                  name="flavor"
                  data-index={i}
                  className="select required form-control"
                  value={nodePool.flavor || ""}
                  onChange={(e) => {
                    e.preventDefault
                    return handleNodePoolChange(
                      e.target.dataset.index,
                      e.target.name,
                      e.target.value
                    )
                  }}
                >
                  {!metaData.loaded ||
                  (metaData.error != null && metaData.errorCount <= 20) ? (
                    <option value="">Loading...</option>
                  ) : (
                    metaData.flavors != null &&
                    metaData.flavors.map((flavor, f_index) => (
                      <option value={flavor.name} key={f_index}>
                        {flavor.name}{" "}
                        {flavor.ram != null && flavor.vcpus != null
                          ? `(ram: ${flavor.ram}, vcpus: ${flavor.vcpus})`
                          : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Nodepool Availability Zone */}
              <div className="form-group string">
                <label className="string control-label" htmlFor="az">
                  Availability Zone <abbr title="required">*</abbr>
                </label>
                <select
                  name="availabilityZone"
                  data-index={i}
                  className="string form-control"
                  disabled={nodePool.availabilityZone && !nodePool.new}
                  value={nodePool.availabilityZone || defaultAZName}
                  onChange={(e) => {
                    e.preventDefault
                    return handleNodePoolChange(
                      e.target.dataset.index,
                      e.target.name,
                      e.target.value
                    )
                  }}
                >
                  {!metaData.loaded ||
                  (metaData.error != null && metaData.errorCount <= 20) ? (
                    <option value="">Loading...</option>
                  ) : (
                    metaData.availabilityZones != null &&
                    Array.from(metaData.availabilityZones).map((az) => (
                      <option
                        value={az.name}
                        key={az.name}
                      >{`${az.name}`}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Nodepool size */}
              <div className="form-group form-group-size">
                <label className="string control-label" htmlFor="size">
                  Size <abbr title="required">*</abbr>
                </label>
                <input
                  className="form-control"
                  data-index={i}
                  type="number"
                  name="size"
                  min="0"
                  placeholder="0"
                  value={isNaN(nodePool.size) ? "" : nodePool.size}
                  onChange={(e) => {
                    e.preventDefault
                    return handleNodePoolChange(
                      e.target.dataset.index,
                      e.target.name,
                      parseInt(e.target.value, 10)
                    )
                  }}
                />
              </div>

              {/* Nodepool Allow Reboot */}
              <div className="checkbox inline-checkbox form-group">
                <label className="string control-label">
                  <input
                    type="checkbox"
                    data-index={i}
                    checked={nodePool.config.allowReboot}
                    onChange={(e) =>
                      handleNodePoolChange(
                        e.target.dataset.index,
                        "allowReboot",
                        !nodePool.config.allowReboot
                      )
                    }
                  />
                  Allow Reboot
                </label>
              </div>

              {/* Nodepool Allow Replace */}
              <div className="checkbox inline-checkbox form-group">
                <label className="string control-label">
                  <input
                    type="checkbox"
                    data-index={i}
                    checked={nodePool.config.allowReplace}
                    onChange={(e) =>
                      handleNodePoolChange(
                        e.target.dataset.index,
                        "allowReplace",
                        !nodePool.config.allowReplace
                      )
                    }
                  />
                  Allow Replace
                </label>
              </div>
              <button
                className="btn btn-secondary"
                data-index={i}
                disabled={clusterForm?.data?.spec?.nodePools?.length <= 1}
                onClick={(e) => {
                  e.preventDefault()
                  return handleNodePoolRemove(e.currentTarget.dataset.index)
                }}
              >
                <span className="fa fa-trash" />
              </button>
            </form>
            {!validateNodePoolName(nodePool.name) && (
              <div className="has-error">
                <p className="help-block">
                  Name should start with a lowercase letter and can contain
                  lowercase letters, numbers, and hyphens. It must end with a
                  lowercase letter or number.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="modal-footer">
        <button
          role="close"
          type="button"
          className="btn btn-secondary"
          onClick={close}
        >
          Close
        </button>
        <ReactFormHelpers.SubmitButton
          label="Create"
          loading={clusterForm.isSubmitting}
          disabled={!clusterForm.isValid}
          onSubmit={() => handleSubmit(close)}
        />
      </div>
    </div>
  )
}

NewCluster = connect(
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
    handleSubmit(callback) {
      return dispatch(submitClusterForm(callback))
    },
    handleSSHKeyChange(value) {
      return dispatch(updateSSHKey(value))
    },
    handleKeyPairChange(value) {
      return dispatch(updateKeyPair(value))
    },
    updateVersion(value) {
      return dispatch(changeVersion(value))
    },
  })
)(NewCluster)

const NewClusterModal = ReactModal.Wrapper("Create Cluster", NewCluster, {
  xlarge: true,
  closeButton: false,
  static: true,
})

export default NewClusterModal
