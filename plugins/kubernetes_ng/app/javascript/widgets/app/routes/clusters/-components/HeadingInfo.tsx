import React, { useState } from "react"
import { CodeBlock, Icon } from "@cloudoperators/juno-ui-components"
import Collapse from "../../../components/Collapse"
import Card from "../../../components/Card"

export default function HeadingInfo() {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <Card>
      <button
        type="button"
        onClick={() => setShowInstructions((prev) => !prev)}
        className="tw-cursor-pointer tw-text-theme-link hover:tw-underline tw-inline-flex tw-items-center tw-gap-1 tw-bg-transparent tw-border-none tw-p-0"
        aria-expanded={showInstructions}
        aria-controls="instructions"
        id="instructions-toggle"
      >
        {showInstructions ? "Hide kubectl Setup Instructions" : "Show kubectl Setup Instructions"}
        <Icon color="global-text" icon={showInstructions ? "expandLess" : "expandMore"} />
      </button>
      <Collapse isOpen={showInstructions} id="instructions" aria-labelledby="instructions-toggle">
        <div className="info tw-mt-4">
          <p className="tw-mb-4">
            For managing your clusters with kubectl, install the{" "}
            <a
              href="https://documentation.global.cloud.sap/docs/customer/containers/persephone/getting-started/installing-scikube/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open scikube installation documentation in a new tab"
              className="tw-text-theme-link hover:tw-underline"
            >
              scikube CLI <Icon size="18" icon="openInNew" className="tw-inline" />
            </a>{" "}
            utility:
          </p>

          <CodeBlock
            content={`# Install via Homebrew (macOS)
brew tap sap-cloud-infrastructure/tap
brew install scikube`}
          />
          <p className="tw-my-4">Then source your OpenStack credentials and generate a garden kubeconfig:</p>

          <CodeBlock
            content={`source "<your-openstack-rc-file.sh>"
# Create garden kubeconfig
scikube kubeconfig-for-garden --landscape <landscape> > kubeconfig-for-garden.yaml
# List clusters in your project
KUBECONFIG=kubeconfig-for-garden.yaml kubectl get shoot
# Connect to a cluster
KUBECONFIG=kubeconfig-for-garden.yaml scikube kubeconfig-for-shoot --name <cluster-name> > kubeconfig-for-shoot.yaml
KUBECONFIG=kubeconfig-for-shoot.yaml kubectl get nodes`}
          />
          <p className="tw-mt-4">
            For detailed instructions including binary installation and cluster management, see the{" "}
            <a
              href="https://documentation.global.cloud.sap/docs/customer/containers/persephone/getting-started/"
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-theme-link hover:tw-underline"
            >
              Persephone documentation <Icon size="18" icon="openInNew" className="tw-inline" />
            </a>
            .
          </p>
        </div>
      </Collapse>
    </Card>
  )
}
