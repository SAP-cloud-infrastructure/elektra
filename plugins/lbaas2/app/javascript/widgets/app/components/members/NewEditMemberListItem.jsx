import React, { useState, useMemo } from "react"
import TagsInput from "../shared/TagsInput"
import uniqueId from "lodash/uniqueId"
import Select from "react-select"
import Log from "../shared/logger"
import { MemberIpIcon, MemberMonitorIcon } from "./MemberIpIcons"
import { FormControl } from "react-bootstrap"
import { useFormState, useFormDispatch } from "./FormState"

const styles = {
  container: (base) => ({
    ...base,
    flex: 1,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
}

const CustomLabel = ({ htmlFor, labelText, required }) => {
  let className = "col-form-label" + " " + (required ? "required" : "optional")
  return (
    <label className={className} htmlFor={htmlFor}>
      {labelText}
      {required && <abbr title="required">*</abbr>}
    </label>
  )
}

const NewEditMemberListItem = ({ id, index, servers, edit }) => {
  const member = useFormState(id)
  const [selectedServers, setSelectedServers] = useState([])
  const [showServers, setShowServers] = useState(false)
  const dispatch = useFormDispatch()

  // create a new id just if the index is different.
  // Avoid rerenders just because it creates a new object with the same id
  const collapseId = useMemo(() => {
    return uniqueId("collapseServerSelect-")
  }, [index])

  const onChangeServers = (values) => {
    setSelectedServers(values)
    if (values) {
      onUpdateItem("name", values?.name || "")
      onUpdateItem("address", values?.address || "")
    }
  }

  const onRemoveItem = (id) => {
    dispatch({
      type: "REMOVE_ITEM",
      id,
    })
  }

  const onUpdateItem = (key, value) => {
    dispatch({
      type: "UPDATE_ITEM",
      id,
      key: key,
      value: value,
    })
  }

  Log.debug("RENDER NewEditMemberListItem")

  return useMemo(() => {
    return (
      <>
        {index > 0 && <hr />}
        <div className="row display-flex">
          <div className="col-md-12">
            {servers && !edit && (
              <div className="row">
                <div className="col-md-1"></div>
                <div className="col-md-11">
                  <div className="display-flex new-member-item-actions">
                    <div
                      className="action-link"
                      onClick={() => setShowServers(!showServers)}
                      data-bs-toggle="collapse"
                      data-bs-target={`#${collapseId}`}
                      aria-expanded={showServers}
                      aria-controls={collapseId}
                    >
                      {showServers ? (
                        <>
                          <span>
                            Choose name and IP from an existing server
                          </span>
                          <i className="fa fa-chevron-circle-up" />
                        </>
                      ) : (
                        <>
                          <span>
                            Choose name and IP from an existing server
                          </span>
                          <i className="fa fa-chevron-circle-down" />
                        </>
                      )}
                    </div>
                    {index > 0 && (
                      <div
                        className="new-member-item-remove action-link"
                        onClick={() => {
                          onRemoveItem(id)
                        }}
                      >
                        <span>Remove</span>
                        <i className="fa fa-trash fa-fw" />
                      </div>
                    )}
                  </div>
                  <div className="collapse margin-top" id={collapseId}>
                    <Select
                      className="basic-single server-select"
                      classNamePrefix="select"
                      isDisabled={false}
                      isLoading={servers.isLoading}
                      isClearable={true}
                      isRtl={false}
                      isSearchable={true}
                      name="servers"
                      onChange={onChangeServers}
                      options={servers.items}
                      isMulti={false}
                      closeMenuOnSelect={true}
                      styles={styles}
                      value={selectedServers}
                      placeholder="Select..."
                    />
                    {servers.error && (
                      <span className="text-danger">{servers.error}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="row margin-top">
              <div className="col-md-1">
                <CustomLabel
                  htmlFor={`member[${member.id}][name]`}
                  labelText="Name"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormControl
                  type="text"
                  id={`member[${member.id}][name]`}
                  name="name"
                  value={member.name || ""}
                  onChange={(e) => {
                    onUpdateItem("name", e.target.value)
                  }}
                />
              </div>
              <div className="col-md-1">
                <CustomLabel
                  htmlFor={`member[${member.id}][backup]`}
                  labelText="Backup"
                />
              </div>
              <div className="col-md-4">
                <input
                  type="checkbox"
                  id={`member[${member.id}][backup]`}
                  name="backup"
                  checked={member.backup}
                  onChange={(e) => {
                    onUpdateItem("backup", e.target.checked)
                  }}
                />
              </div>
            </div>

            <div className="row margin-top">
              <div className="col-md-1">
                <CustomLabel
                  htmlFor={`member[${member.id}][address]`}
                  labelText="IPs"
                  required
                />
              </div>
              <div className="col-md-6">
                <div className="display-flex member-icon-in-input member-required-icon">
                  <MemberIpIcon />
                  <FormControl
                    type="text"
                    id={`member[${member.id}][address]`}
                    name="address"
                    value={member.address || ""}
                    disabled={edit}
                    placeholder="IP Address &#42;"
                    className="icon-in-input"
                    onChange={(e) => {
                      onUpdateItem("address", e.target.value)
                    }}
                  />
                  <span className="horizontal-padding-min">:</span>
                  <FormControl
                    type="number"
                    id={`member[${member.id}][protocol_port]`}
                    name="protocol_port"
                    value={member.protocol_port || ""}
                    disabled={edit}
                    placeholder="Port &#42;"
                    onChange={(e) => {
                      onUpdateItem("protocol_port", e.target.value)
                    }}
                  />
                </div>
              </div>
              <div className="col-md-1">
                <CustomLabel
                  htmlFor={`member[${member.id}][weight]`}
                  labelText="Weight"
                />
              </div>
              <div className="col-md-4">
                <FormControl
                  type="number"
                  id={`member[${member.id}][weight]`}
                  name="weight"
                  value={member.weight || ""}
                  onChange={(e) => {
                    onUpdateItem("weight", e.target.value)
                  }}
                />
              </div>
            </div>

            <div className="row margin-top">
              <div className="col-md-1"></div>
              <div className="col-md-6">
                <div className="display-flex member-icon-in-input">
                  <MemberMonitorIcon />
                  <FormControl
                    type="text"
                    id={`member[${member.id}][monitor_address]`}
                    name="monitor_address"
                    value={member.monitor_address || ""}
                    placeholder="Alternate Monitor IP"
                    className="icon-in-input"
                    onChange={(e) => {
                      onUpdateItem("monitor_address", e.target.value)
                    }}
                  />
                  <span className="horizontal-padding-min">:</span>
                  <FormControl
                    type="number"
                    id={`member[${member.id}][monitor_port]`}
                    name="monitor_port"
                    value={member.monitor_port || ""}
                    placeholder="Port"
                    onChange={(e) => {
                      onUpdateItem("monitor_port", e.target.value)
                    }}
                  />
                </div>
              </div>
              <div className="col-md-1">
                <CustomLabel
                  htmlFor={`member[${member.id}][tags]`}
                  labelText="Tags"
                />
              </div>
              <div className="col-md-4">
                <TagsInput
                  name={`member[${member.id}][tags]`}
                  initValue={member.tags}
                  useFormContext={false}
                  onChange={(editorTags) => {
                    const tags = editorTags.map((item, index) => {
                      return item.value || item
                    })
                    onUpdateItem("tags", tags)
                  }}
                />
                <span className="form-text">
                  <i className="fa fa-info-circle"></i>
                  Start a new tag typing a string and hitting the <b>
                    Enter
                  </b>{" "}
                  or <b>Tab key</b>.
                </span>
              </div>
            </div>

            {edit && (
              <div className="row margin-top">
                <div className="col-md-1"></div>
                <div className="col-md-6"></div>
                <div className="col-md-1">
                  <CustomLabel
                    htmlFor={`member[${member.id}][admin_state_up]`}
                    labelText={
                      <>
                        <span>Admin </span>
                        <span className="nowrap">State Up</span>
                      </>
                    }
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="checkbox"
                    id={`member[${member.id}][admin_state_up]`}
                    name="admin_state_up"
                    checked={member.admin_state_up}
                    onChange={(e) => {
                      onUpdateItem("admin_state_up", e.target.checked)
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }, [
    member,
    showServers,
    collapseId,
    JSON.stringify(servers),
    selectedServers,
    setShowServers,
    onChangeServers,
  ])
}

export default NewEditMemberListItem
