/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
import ReactModal from "../../lib/modal"
import { connect } from "react-redux"

let SetupInfo = ({ close, setupData, kubernikusBaseUrl }) =>
  React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { className: "modal-body" },
      <h4>Download Binaries</h4>,
      <p>
        Download the file matching your operating system, save it somewhere in
        your path and make it executable.
      </p>,
      Array.from(setupData.binaries).map((bin) => (
        <div key={bin.name}>
          <h5>{`${bin.name}:`}</h5>
          <ul className="content-list">
            {Array.from(bin.links).map((link, i) => (
              <li key={i}>
                <a
                  target="_blank"
                  href={link.link}
                  rel="noreferrer"
                >{`Download for ${
                  link.link.match(/darwin_amd64/g)
                    ? "darwin amd64"
                    : link.link.match(/darwin_arm64/g)
                    ? "darwin arm64"
                    : link.platform
                }`}</a>
              </li>
            ))}
          </ul>
        </div>
      )),
      <br />,
      <h4>Execute Setup Command</h4>,
      <p>Copy the below setup command and execute it in your terminal.</p>,
      React.createElement(
        "pre",
        {
          className: "snippet",
          ref(el) {
            return $(el).initSnippetCopyToClipboard()
          },
        },
        <code>{setupData.setupCommand}</code>
      )
    ),
    <div className="modal-footer">
      <button
        role="close"
        type="button"
        className="btn btn-secondary"
        onClick={close}
      >
        Close
      </button>
    </div>
  )

SetupInfo = connect((state) => ({
  setupData: state.clusters.setupData,
  kubernikusBaseUrl: state.clusters.kubernikusBaseUrl,
}))(SetupInfo)

export default ReactModal.Wrapper("Setup Information", SetupInfo, {
  large: true,
  closeButton: false,
  static: true,
})
