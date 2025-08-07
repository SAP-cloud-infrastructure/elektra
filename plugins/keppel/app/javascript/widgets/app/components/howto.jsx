/* eslint-disable react/no-unescaped-entities */
import { Link } from "react-router-dom"
import React from "react"
import { SelectBox } from "./componentHelpers/SelectBox"

const apiStyleOptions = [
  { value: "regular", label: "Default style (account name in path)" },
  {
    value: "domainremap",
    label: "Domain-remapped style (account name in domain)",
  },
]

export default class Howto extends React.Component {
  state = {
    apiStyle: "regular",
  }

  setAPIStyle(apiStyle) {
    this.setState({ apiStyle })
  }

  render() {
    const { dockerInfo, accountName, repoName, handleClose } = this.props
    const { registryDomain, userName } = dockerInfo

    const isDomainRemapped = this.state.apiStyle == "domainremap"
    const fullRegistryDomain = isDomainRemapped ? `${accountName}.${registryDomain}` : registryDomain
    const fullRepoName = isDomainRemapped ? repoName : `${accountName}/${repoName}`

    return (
      <div className="plugin-help visible">
        <div className="bs-callout bs-callout-info bs-callout-emphasize">
          <a
            className="close-button"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleClose()
            }}
          >
            x
          </a>
          <h4>How to use this {repoName == "<repo>" ? "account" : "repository"} with Docker</h4>
          <p>
            {
              <SelectBox
                options={apiStyleOptions}
                value={this.state.apiStyle}
                isEditable={true}
                onChange={(e) => {
                  e.preventDefault()
                  this.setAPIStyle(e.target.value)
                }}
              />
            }
          </p>
          <ol className="howto">
            <li>
              Log in with your OpenStack credentials:
              <pre>
                <code>
                  {`$ docker login ${fullRegistryDomain}\nUsername: `}
                  <strong>{userName}</strong>
                  {`\nPassword: `}
                  <strong>{`<your password>`}</strong>
                </code>
              </pre>
            </li>
            <li>
              To push an image, use this command:
              <pre>
                <code>{`$ docker push ${fullRegistryDomain}/${fullRepoName}:<tag>`}</code>
              </pre>
            </li>
            <li>
              To pull an image, use this command:
              <pre>
                <code>{`$ docker pull ${fullRegistryDomain}/${fullRepoName}:<tag>`}</code>
              </pre>
              When the repository permits anonymous pulling, logging in is not required. Check{" "}
              <Link to={`/accounts/${accountName}/access_policies`}>the account's access policies</Link> for details.
            </li>
          </ol>
        </div>
      </div>
    )
  }
}
