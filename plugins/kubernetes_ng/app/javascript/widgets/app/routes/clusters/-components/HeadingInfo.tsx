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
            For conveniently managing your clusters with kubectl, first install the scikube CLI utility, then generate
            the kubeconfig file for your OpenStack domain/project. Download the latest source code zip/tarball, then:
          </p>

          <CodeBlock
            content={`# Generic instructions: all platforms
PERSEPHONE_VERSION='0.2.0'
unzip persephone-"$PERSEPHONE_VERSION".zip
cd persephone-"$PERSEPHONE_VERSION"
make build/scikube && ./build/scikube -h`}
          />
          <p className="tw-my-4">
            Make sure to include scikube in your shell PATH. Finally, set up your OpenStack variables and create your
            "garden kubeconfig" file as follows:
          </p>

          <CodeBlock
            content={`source "<your-openstack-rc-file.sh>"
# create kubeconfig file
scikube kubeconfig-for-garden --landscape canary > kubeconfig-for-garden.yaml
# list your domain/project clusters
KUBECONFIG=kubeconfig-for-garden.yaml kubectl get shoot
# create a new cluster on your domain/project
KUBECONFIG=kubeconfig-for-garden.yaml kubectl apply -f "<your-new-shoot-manifest.yaml>"`}
          />
        </div>
      </Collapse>
    </Card>
  )
}
