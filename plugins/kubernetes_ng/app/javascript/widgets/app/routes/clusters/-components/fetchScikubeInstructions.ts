/**
 * Mock fetch function that simulates fetching the ConfigMap from Kubernetes API
 * TODO: Replace with real API call to fetch from gardener-system-public/scikube-getting-started-markdown
 */
export const fetchScikubeInstructions = async (): Promise<string> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Mock ConfigMap data - this is what will come from the real API
  const mockConfigMapData = {
    data: {
      "README.md": `For managing your clusters with kubectl, install the [scikube CLI](https://documentation.global.cloud.sap/docs/customer/containers/persephone/getting-started/installing-scikube/) utility:

\`\`\`bash
# Install via Homebrew (macOS)
brew tap sap-cloud-infrastructure/tap
brew install sap-cloud-infrastructure/tap/scikube
\`\`\`

Then source your OpenStack credentials and generate a garden kubeconfig:

\`\`\`bash
source "<your-openstack-rc-file.sh>"
# Create garden kubeconfig
scikube kubeconfig-for-garden --landscape <landscape> > kubeconfig-for-garden.yaml
# List clusters in your project
KUBECONFIG=kubeconfig-for-garden.yaml kubectl get shoot
# Connect to a cluster
KUBECONFIG=kubeconfig-for-garden.yaml scikube kubeconfig-for-shoot --name <cluster-name> > kubeconfig-for-shoot.yaml
KUBECONFIG=kubeconfig-for-shoot.yaml kubectl get nodes
\`\`\`

For detailed instructions including binary installation and cluster management, see the [Persephone documentation](https://documentation.global.cloud.sap/docs/customer/containers/persephone/getting-started/).`,
    },
  }

  return mockConfigMapData.data["README.md"]
}

// TODO: Real implementation will look like this:
// export const fetchScikubeInstructions = async (): Promise<string> => {
//   const response = await fetch('/api/v1/namespaces/gardener-system-public/configmaps/scikube-getting-started-markdown')
//   const configMap = await response.json()
//   return configMap.data['README.md']
// }
